import {Toaster} from 'shared/Toaster'
const log = getLogger(__filename)

import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Events, ReduxDebugSessionKey} from '../Constants'
import {AppActionFactory as AppActionFactoryType} from '../actions/AppActionFactory'
import {getReducers} from 'shared/store/Reducers'
import {Container} from 'typescript-ioc'
import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore,
	getAction,
	addActionInterceptor,
	IActionInterceptorNext
} from 'typedux'


const electron = require('electron')
const ipc = (Env.isRenderer) ? electron.ipcRenderer : electron.ipcMain as any







if (Env.isRenderer) {
	const unregisterInterceptor = addActionInterceptor((leaf:string,name:string,next:IActionInterceptorNext,...args:any[]) => {
		ipc.send(Events.StoreRendererDispatch,leaf,name,args)
		return
	})

	if (module.hot) {

		module.hot.dispose(() => {
			log.info(`HMR Removing action interceptor`)
			unregisterInterceptor()
		})
	}
}


// HMR - setup
let hmrReady = false

/**
 * Attach to reducers, etc
 */
function hmrSetup() {
	if (!Env.isRenderer && module.hot && !hmrReady) {
		hmrReady = true

		module.hot.accept(['./Reducers'],(updates) => {
			log.info(`Reducer Updates received, reloading reducers`, updates)

			getStore().replaceReducers(...getReducers())
		})
	}
}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = [
	thunkMiddleware
]

// DEV + RENDERER - ADD LOGGER
if (Env.isDev && Env.isRenderer) {
	const reduxLogger = createLogger();
	middleware.push(reduxLogger)
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
 * Make remote middleware
 *
 * @returns {Array<Middlware>}
 */
function makeRemoteMiddleware(name:string = null) {
	const remoteDevTools = require('remote-redux-devtools')
	return remoteDevTools({
		name: 'EpicTask - ' + (name || ((Env.isRenderer) ? 'RENDERER' : 'MAIN')),
		realtime: true,
		hostname: 'localhost', port: 8787
	})
}

let DevTools = null, DevToolsMiddleware = null

export function getDevTools() {
	return DevTools
}

export function loadDevTools() {
	if (DevToolsMiddleware)
		return DevToolsMiddleware

	DevTools = require('ui/components/debug/DevTools.tsx').DevTools
	DevToolsMiddleware = DevTools.instrument()

	return DevToolsMiddleware
}


let store:ObservableStore<any>

const storeEnhancer = (Env.isRenderer) ?
	require('./RendererStoreEnhancer').default :
	require('./MainStoreEnhancer').default


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
	return ReduxDebugSessionKey
}

/**
 * OnError handling for all reducers
 *
 * @param err
 * @param reducer
 */
function onError(err:Error,reducer?:ILeafReducer<any,any>) {
	const toaster = Container.get(Toaster)

	toaster.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
export function initStore(devToolsMode = false) {


	/**
	 * DevToolsMiddleware is configured in DEBUG mode anyway
	 *
	 * @type {function(): *}
	 */
	const debugMiddleware =
		(devToolsMode) ? loadDevTools() :
			(!Env.isDev) ? NullMiddleware :
				(Env.isRenderer && window.devToolsExtension) ? window.devToolsExtension() :
					(Env.isRemote || !Env.isRenderer) ? makeRemoteMiddleware() :
						loadDevTools()

	let reducers = (Env.isRenderer) ? [] : getReducers()

	// Create the store
	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose(
			applyMiddleware(...middleware),
			storeEnhancer,
			debugMiddleware
		) as StoreEnhancer<any>
	)

	// If HMR enabled then prepare for it
	hmrSetup()

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)


	// Initialize all action factories
	if (!devToolsMode) {
		const actionCtx = require.context('shared/actions', true, /ActionFactory\.ts$/)
		actionCtx.keys()
			.filter(key => !/AppActionFactory/.test(key))
			.forEach(key => {
				const mod:any = actionCtx(key)
				const factory = mod.default
				new factory()
			})
	}
	return store
}

/**
 * Get the observable store
 *
 * @returns {ObservableStore<any>}
 */
export function getStore() {
	if (!store) {
		initStore()
	}
	return store
}

export function getReduxStore() {
	return getStore().getReduxStore()
}

//
// if (module.hot) {
// 	module.hot.accept(['./MainStoreEnhancer','./RenderStoreEnhancer'],(updates) => {
// 		log.info('enhancer changed',updates)
//
// 	})
// }
