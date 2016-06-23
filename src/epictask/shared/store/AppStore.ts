import {requireContext} from '../util/ContextUtils'
const log = getLogger(__filename)

import * as Immutable from 'immutable'
import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Events} from 'shared/Constants'
import {AppActionFactory as AppActionFactoryType} from 'shared/actions/AppActionFactory'

const { electronEnhancer } = require('redux-electron-store')
const electron = require('electron')
const ipc = (Env.isRenderer) ? electron.ipcRenderer : electron.ipcMain as any



import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore,
	getAction,
	addActionInterceptor,
	IActionInterceptorNext
} from 'typedux'

if (Env.isRenderer) {
	addActionInterceptor((leaf:string,name:string,next:IActionInterceptorNext,...args:any[]) => {
		ipc.send(`store-browser-dispatch`,leaf,name,args)
		return
	})
}

//const reduxLogger = createLogger();

const clients = {}
const windowMap = {}

function unregisterRenderer(webContentsId) {
	clients[webContentsId].active = false
}


function hydrateState(state) {
	const reducers = getReducers()

	if (!state)
		return

	const keys = (Immutable.Map.isMap(state)) ?
		state.keys() :
		Object.keys(state)

	return keys
		.reduce((finalState,key) => {
			const reducer = reducers.find(reducer => reducer.leaf() === key)
			let val = state.get ? state.get(key) : state[key]
			if (reducer) {
				val = reducer.prepareState(val)
			}

			return finalState.set(key,val)
		},Immutable.Map())


}

function getMainProcessState() {

	let mainState = ipc.sendSync(Events.GetMainState)
	if (mainState) {
		log.debug('Got main state',Object.keys(mainState))
		mainState = hydrateState(mainState)
	}

	return mainState
}


/**
 * Null middleware that can be used
 * wherever a passthru is required
 *
 * @param f
 * @constructor
 */
const NullMiddleware = f => f

/**
 * DevToolsMiddleware is configured in DEBUG mode anyway
 *
 * @type {function(): *}
 */
const devToolsMiddleware =
	(!DEBUG || !Env.isRenderer) ? NullMiddleware :
	(window.devToolsExtension) ? window.devToolsExtension() :
	require('ui/components/debug/DevTools.tsx').DevTools.instrument()

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = [
	thunkMiddleware
]

// if (!Env.isRenderer) {
// 	middleware.push(reduxLogger)
// }

let store:ObservableStore<any>
let ctx:any

let hmrReady = false
let reducers = null

function getReducers():ILeafReducer<any,any>[] {
	if (reducers)
		return reducers

	// TODO - LOAD FROM SERVICE REGISTRY
	ctx = require.context('shared/actions',true,/Reducer\.ts$/)

	// If HMR enabled then prepare for it
	if (module.hot && !hmrReady) {
		hmrReady = true

		module.hot.accept([ctx.id],(updates) => {
			log.info(`${Env.isRenderer ? 'Renderer ' : 'Main '} Reducer Updates received, reloading reducers`,
				updates)

			reducers = null
			getStore().replaceReducers(...getReducers())
			//NOTE: We dont need to below code fro electron-redux between both
			// MAIN and RENDERER - are webpack apps
			//
			// if (Env.isRenderer) {
			// 	require('electron').ipcRenderer.sendSync('renderer-reload')
			// }
		})
	}

	const mods = ctx.keys().map(ctx)

	reducers = []
	mods.forEach(mod => {
		for (let key of Object.keys(mod)) {
			if (_.endsWith(key,'Reducer')) {
				const reducerClazz = mod[key]
				reducers.push(new reducerClazz())
			}
		}
	})

	log.debug('Returning reducers',reducers)
	return reducers
}

/**
 * Broadcasts action and resulting state to
 * clients / browserWindows'
 *
 * @param action
 * @param newState
 */
function broadcastActionAndStateToClients(action,newState) {
	if (!newState || !action)
		return

	if (newState.toJS)
		newState = newState.toJS()

	Object.keys(clients)
		.map(key => ({
			webContentsId:key,
			client:clients[key]
		}))
		.filter(({client}) => client.active)
		.forEach(({webContentsId,client}) => {
			const {webContents} = client
			if (webContents.isCrashed() || webContents.isDestroyed()) {
				unregisterRenderer(webContentsId)
				return
			}

			webContents.send(`store-browser-state-change`, {action,newState})
		})
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function mainStoreEnhancer(storeCreator) {
	return (reducer, initialState) => {
		let store = storeCreator(reducer, initialState)

		const storeDotDispatch = store.dispatch

		store.dispatch = (action) => {
			const state = store.getState()
			storeDotDispatch(action)
			const newState = store.getState()

			if (state === newState)
				return

			broadcastActionAndStateToClients(action,newState)
		}

		return store
	}
}

function rendererStoreEnhancer(storeCreator) {
	return (reducer, initialState) => {

		let receivedState = null
		let receivedAction = null

		reducer = (state = initialState,action) => {
			if (receivedState) {
				state = receivedState
				receivedState = null
			}

			return state
		}

		let store = storeCreator(reducer, initialState)

		ipc.on(`store-browser-state-change`,(event,{action,newState}) => {
			if (!newState)
				return

			receivedState = hydrateState(newState)
			store.dispatch(action)
		})

		return store
	}

}

const storeEnhancer = (Env.isRenderer) ? rendererStoreEnhancer : mainStoreEnhancer


/**
 * onChange event of store
 */
function onChange() {
	log.debug(`Store state changed`)


}

/**
 * Debug session key
 *
 * @returns {string}
 */
function getDebugSessionKey() {
	// You can write custom logic here!
	// By default we try to read the key from ?debug_session=<key> in the address bar
	//const matches = window.location.href.match(/[?&]debug_session=([^&#]+)\b/);
	//return (matches && matches.length > 0)? matches[1] : null;
	return 'electron-debug-session'
}

/**
 * OnError handling for all reducers
 *
 * @param err
 * @param reducer
 */
function onError(err:Error,reducer?:ILeafReducer<any,any>) {
	const AppActionFactory:typeof AppActionFactoryType = require('shared/actions').AppActionFactory

	const actions = new AppActionFactory()
	actions.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
function initStore(defaultState = null) {

	const devTools = [devToolsMiddleware]
	// if (Env.isDev && Env.is) {
	// 	const statePersistence = require('redux-devtools').persistState(getDebugSessionKey())
	// 	devTools.push(statePersistence)
	// }

	const newStore = ObservableStore.createObservableStore(
		getReducers(),
		compose(
			applyMiddleware(...middleware),
			storeEnhancer,
			devToolsMiddleware
		) as StoreEnhancer<any>,
		defaultState
	)

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)

	if (Env.isRenderer) {
		const {remote}= electron
		let rendererId = (process as any).guestInstanceId || remote.getCurrentWindow().id;
		let clientId = (process as any).guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`;
		ipc.send('store-register-renderer',{clientId})
	}

	return store
}


export async function createStore() {
	let defaultState = (Env.isRenderer) ?
		getMainProcessState() :
		null

	return initStore(defaultState)

}

export function getStore() {
	if (!store) {
		if (Env.isRenderer) {
			throw new Error('Only main process can synchronously init store, use createStore ')
		}
		initStore()
	}
	return store
}

export function getReduxStore() {
	return getStore().getReduxStore()
}



// If on the main process then add a handler for
// retrieving main state
if (!Env.isRenderer) {
	ipc.on(Events.GetMainState,(event) => {
		log.info('Getting state for renderer')

		const store = getReduxStore()
		const mainState = store ? store.getState() : null

		event.returnValue = mainState ? mainState.toJS() : null
	})

	ipc.on(`store-browser-dispatch`,(event,leaf,name,args) => {
		const action = getAction(leaf,name)
		if (!action)
			throw new Error(`Could not find action ${leaf}:${name} on main process`)

		log.info(`Executing action on main: ${leaf}:${name}`)
		action(...args)
	})

	ipc.on(`store-register-renderer`, (event, { filter, clientId }) => {
		const { sender } = event

		let webContentsId = sender.getId()
		clients[webContentsId] = {
			webContents: sender,
			filter,
			clientId,
			windowId: sender.getOwnerBrowserWindow().id,
			active: true
		}

		if (!sender.isGuest()) { // For windowMap (not webviews)
			let browserWindow = sender.getOwnerBrowserWindow()
			if (windowMap[browserWindow.id] !== undefined) {
				unregisterRenderer(windowMap[browserWindow.id])
			}
			windowMap[browserWindow.id] = webContentsId

			// WebContents aren't automatically destroyed on window close
			browserWindow.on('closed', () => unregisterRenderer(webContentsId))
		}

		event.returnValue = true
	});
}



