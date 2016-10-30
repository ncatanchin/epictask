import thunkMiddleware from "redux-thunk"
import { Store as ReduxStore, StoreEnhancer, compose, applyMiddleware } from "redux"
import { Map } from "immutable"
import {
	ReduxDebugSessionKey,
	getNotificationCenter,
	If,
	getHot,
	setDataOnHotDispose, ProcessType
} from "epic-global"
import { getReducers } from "./Reducers"
import { setStoreProvider, ILeafReducer, ObservableStore} from "typedux"
import { loadActionFactories } from "../provider"
import { attachChildStore } from "./AppStoreClient"
import addDevMiddleware from "epic-typedux/store/AppStoreDevConfig"
//import { installActionInterceptor } from "epic-typedux/store/ActionInterceptor"
import { configureStorePersistence, loadStateFromDisk } from "epic-typedux/store/AppStorePersistence"
import {
	IChildStoreSubscriptionManager, IChildStore,
	ChildStoreSubscriptionStatus
} from "epic-typedux/store/ChildStore"
import { AppStoreEnhancerKey } from "epic-global"
import { getValue } from "epic-global"


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
function initStore(devToolsMode = false, defaultState = null) {
	
	const
		enhancers = [
			applyMiddleware(...middleware)
		]
	
	// THE CLIENT ENHANCER IS THE DEFAULT, BUT MAIN-ENTRY HAS IT'S OWN
	let
		appStoreEnhancer =
			getValue(() => Container.get<any>(AppStoreEnhancerKey),require('./AppStoreClientEnhancer').default)
	
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
 * @returns {ObservableStore<any>}
 */

export async function loadAndInitStore(defaultStateValue = null) {
	loadActionFactories()
	
	
	// ONLY LOAD STATE ON MAIN UI PROCESS
	if (ProcessConfig.isType(ProcessType.UI)) {
		defaultStateValue = loadStateFromDisk()
	}
	
	return initStore(false, defaultStateValue)
}


/**
 * Create a child store that connects to the root process
 *
 * @returns {ObservableStore<any>}
 */
export async function loadAndInitChildStore() {
	// loadActionFactories()
	//
	//
	// return initStore(false, null)
	let
		childReduxStore,
		initialState,
		manager:IChildStoreSubscriptionManager

	const
		// Message list - this is used to save reducer messages until ready
		pendingMessages = [],

		// Child Store
		childStore:IChildStore = {
			dispatch(action) {
				if (childReduxStore) {
					childReduxStore.dispatch(action)
				} else {
					pendingMessages.push(action)
				}
			},

			setState(state) {
				log.info(`Child got initial state`, state)
				initialState = state
			}
		}

	try {
		manager = await attachChildStore(childStore)
		manager.onStatusChange((status:ChildStoreSubscriptionStatus, err:Error = null) => {
			log.info(`Child store state changed`, status, err)
		})

		//installActionInterceptor(manager)

		const
			preStore = await loadAndInitStore(initialState)

		while (pendingMessages.length) {
			const
				nextMsg = pendingMessages.shift()

			preStore.dispatch(nextMsg)
		}

		//noinspection JSUnusedAssignment
		childReduxStore = preStore
	} catch (err) {
		log.error(`Failed to start the child store - this is bad`, err)
		throw err
	}

	return store
	
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
	return getStore() ? getStore().getState() : Immutable.Map()
}

// In Development Environment, expose getStore/getStoreState
If(DEBUG, () => {
	_.assignGlobal({
		getStore,
		getStoreState
	})
})

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
