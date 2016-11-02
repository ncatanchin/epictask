import thunkMiddleware from "redux-thunk"
import { Store as ReduxStore, StoreEnhancer, compose, applyMiddleware } from "redux"
import { Map } from "immutable"
import { ReduxDebugSessionKey, If, getHot, setDataOnHotDispose } from "epic-global"
import { getReducers } from "./Reducers"
import { setStoreProvider, ILeafReducer, ObservableStore } from "typedux"

import { loadActionFactories } from "../provider"

import { configureStorePersistence } from "./AppStorePersistence"
import addDevMiddleware from "./AppStoreDevConfig"

const
	log = getLogger(__filename),
	ActionLoggerEnabled = false

// HMR - setup
let
	hmrReady = false,
	hmrDisposed = false

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Create the appropriate middleware
 *
 * @returns {any}
 */
function createMiddleware() {
	return [ thunkMiddleware ]
}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const
	middleware = getHot(module, 'middleware', createMiddleware())

let
	store:ObservableStore<any> = getHot(module, 'store') as any

// Check for hot reload
If(store, () => {
	hmrSetup()
	updateReducers()
})

//noinspection JSUnusedLocalSymbols
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
function onError(err:Error, reducer?:ILeafReducer<any,any>) {
	const
		toaster = getNotificationCenter()
	
	log.error('Reducer error occurred', reducer, err, err.stack)
	setImmediate(() => {
		toaster.addErrorMessage(err)
	})
	
}


function updateReducers() {
	log.debug('Updating reducers')
	getStore().replaceReducers(...getReducers())
}

/**
 * Setup HMR for the store
 */
function hmrSetup() {
	if (module.hot && !hmrReady) {
		hmrReady = true
		
		module.hot.accept([ './Reducers' ],updateReducers)
	}
}

/**
 * Initialize/Create the store
 */
function initStore(devToolsMode = false, defaultState = null, enhancer = null) {
	
	const
		enhancers = [
			applyMiddleware(...middleware)
		]
	
	// THE CLIENT ENHANCER IS THE DEFAULT, BUT MAIN-ENTRY HAS IT'S OWN
	let
		appStoreEnhancer = enhancer || require('./AppStoreClientEnhancer').default
	
	enhancers.push(appStoreEnhancer)
	
	
	// if (Env.isDev && Env.isRenderer && ActionLoggerEnabled) {
	// 	enhancers.push(applyMiddleware(createLogger()))
	// }
	
	/**
	 * Redux Dev Tooling
	 *
	 * @type {function(): *}
	 */
	addDevMiddleware(enhancers)
	
	let
		reducers = getReducers()
	
	// CREATE STORE
	const
		newStore = ObservableStore.createObservableStore(
			reducers,
			compose.call(null, ...enhancers) as StoreEnhancer<any>,
			null,
			defaultState
		)
	
	// If HMR enabled then prepare for it
	hmrSetup()
	
	newStore.rootReducer.onError = onError
	
	
	store = newStore
	setStoreProvider(newStore)
	
	
	// Initialize all action factories
	if (!devToolsMode) {
		loadActionFactories()
	}
	
	configureStorePersistence(newStore,getStoreState)
	return store
}

/**
 * A store specifically for testing & storybook
 */
export function loadAndInitStorybookStore() {
	const
		enhancers = [ applyMiddleware(...middleware) ]
	
	addDevMiddleware(enhancers)
	
	const
		reducers = getReducers()
	
	log.info(`Creating story book with reducers`, reducers)
	
	// Create the store
	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose.call(null, ...enhancers) as StoreEnhancer<any>,
		null
	)
	
	// If HMR enabled then prepare for it
	hmrSetup()
	
	newStore.rootReducer.onError = onError
	
	
	store = newStore
	setStoreProvider(newStore)
	loadActionFactories()
	
	
	// PERSISTENCE
	configureStorePersistence(newStore,getStoreState)
	
	
	newStore.dispatch({ type: "@INIT" })
	return store
}


/**
 * Load existing state from disk
 *
 * @param defaultStateValue
 * @param enhancer
 * @returns {ObservableStore<any>}
 */

export async function loadAndInitStore(defaultStateValue = null, enhancer = null) {
	loadActionFactories()
	
	return initStore(false, defaultStateValue,enhancer)
}


/**
 * Get the observable store
 *
 * @returns {ObservableStore<any>}
 */
export function getStore() {
	return store
}

/**
 * Retrieve underlying redux store
 *
 * @returns {ReduxStore}
 */
export function getReduxStore():ReduxStore<Map<string,any>> {
	return getStore() && getStore().getReduxStore()
}

/**
 * Get the current state
 *
 * @returns {Map<string,any>}
 */
export function getStoreState():Map<string,any> {
	return getStore() ? getStore().getState() : Map()
}

// In Development Environment, expose getStore/getStoreState
// If(DEBUG, () => {
assignGlobal({
	getStore,
	getReduxStore,
	getStoreState
})
// })

/**
 * Expose globally
 */
declare global {
	function getStore():ObservableStore<Map<string,any>>
	function getStoreState():Map<string,any>
	function getReduxStore():ReduxStore<Map<string,any>>
}


setDataOnHotDispose(module, () => ({
	store,
	middleware
}))



if (module.hot) {
	// On dispose, save current middleware and store
	module.hot.addDisposeHandler(() => {
		hmrDisposed = true
	})
	
	module.hot.accept(() => log.info(`HMR update`, __filename))
}


/**
 * Declare dev tools extensions
 */
declare global{
	interface Window {
		devToolsExtension:any
	}
}
