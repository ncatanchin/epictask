import {Toaster} from 'shared/Toaster'
const log = getLogger(__filename)

import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Events, ReduxDebugSessionKey} from '../Constants'
import {getReducers} from 'shared/store/Reducers'
import {Container} from 'typescript-ioc'
import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore,
	addActionInterceptor,
	IActionInterceptorNext,
	IActionRegistration
} from 'typedux'

import {
	writeJSONFileAsync,
	cacheFilename,
	readFile,
	writeJSONFile
} from 'shared/util/Files'

import {
	loadActionFactories
} from 'shared/actions/ActionFactoryProvider'



const electron = require('electron')
const ipc = (Env.isRenderer) ?
	electron.ipcRenderer :
	electron.ipcMain as any

const stateFilename = cacheFilename('store-state')
const ActionLoggerEnabled = false


// If renderer then add an action interceptor
if (Env.isRenderer) {
	const browserNextTick = require('browser-next-tick')
	const unregisterInterceptor = addActionInterceptor((reg:IActionRegistration,next:IActionInterceptorNext,...args:any[]) => {
		const {leaf,type,options} = reg

		browserNextTick(() => ipc.send(Events.StoreRendererDispatch,leaf,type,args))

		return (options && options.isReducer) ? next() : null

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
 * Create the appropriate middleware
 *
 * @returns {any}
 */
function createMiddleware() {
	if (Env.isRenderer) {
		//return (Env.isDev) ? [createLogger()] : []
		return []
	} else {
		return [thunkMiddleware]
	}

}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = createMiddleware()


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
	persistStoreState(getStoreState())
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
	log.error('Reducer error occurred',err,reducer)
	toaster.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
export function initStore(devToolsMode = false,defaultState = null) {

	const enhancers = [
		applyMiddleware(...middleware),
		storeEnhancer
	]

	if (Env.isDev && Env.isRenderer && ActionLoggerEnabled) {
		enhancers.push(applyMiddleware(createLogger()))
	}

	/**
	 * DevToolsMiddleware is configured in DEBUG mode anyway
	 *
	 * @type {function(): *}
	 */
	const debugEnhancer =
		(!Env.isDev) ? NullMiddleware  :
			(Env.isRenderer && window.devToolsExtension) ?
				window.devToolsExtension() :
				makeRemoteMiddleware()
			// (Env.isMain) ?  makeRemoteMiddleware() :
			// 	loadDevTools()


	enhancers.push(debugEnhancer)

	let reducers = getReducers()

	// Create the store
	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose.call(null,...enhancers) as StoreEnhancer<any>,
		null,
		defaultState
	)

	// If HMR enabled then prepare for it
	hmrSetup()

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)


	// Initialize all action factories
	if (!devToolsMode) {
		loadActionFactories()
	}
	return store
}

/**
 * Load existing state from disk
 *
 * @returns {ObservableStore<any>}
 */
export async function loadAndInitStore() {
	const stateData = readFile(stateFilename)
	let defaultStateValue = null
	try {
		if (stateData)
			defaultStateValue = JSON.parse(stateData)
	} catch (err) {
		log.error('unable to load previous state data, starting fresh',err)
	}
	return initStore(false,defaultStateValue)
}


let persistingState = false

/**
 * Write the actual state async
 */
async function writeStoreState() {
	const fs = require('fs')
	await fs.writeFile(stateFilename,_.toJS(getStoreState()))
}


/**
 * Debounced persist store state call
 */
const persistStoreState = _.debounce((state) => {
	if (!Env.isMain)
		return

	log.info(`Writing current state to: ${stateFilename}`)
	if (persistingState) {
		log.info('Persisting, can not persist until completion')
		return
	}

	persistingState = true
	Promise
		.resolve(writeStoreState())
		.catch(err => {
			log.error('state persistence failed',err)
		})
		.finally(() => persistingState = false)

},10000,{maxWait:30000})

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

export function getStoreState() {
	return getStore().getState()
}

if (Env.isDev) {
	_.assignGlobal({
		getStore,
		getStoreState
	})
}

export function persist(doAsync = false) {
	log.info(`Writing current state (shutdown) to: ${stateFilename}`)
	if (persistingState) {
		log.info('Persisting, can not persist until completion')
		return
	}
	assert(Env.isMain,'Can only persist on main')
	const stateJS = _.toJS(getStoreState())
	if (doAsync)
		writeJSONFileAsync(stateFilename,stateJS)
	else
		writeJSONFile(stateFilename,stateJS)

}
