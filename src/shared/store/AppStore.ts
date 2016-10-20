
import thunkMiddleware from 'redux-thunk'
import {Store as ReduxStore} from 'redux'
import {Map} from 'immutable'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import { UIKey, RepoKey } from 'shared/Constants'
import {ReduxDebugSessionKey} from 'shared/config/DebugConfig'
import { getToaster } from 'shared/Toaster'
import {getReducers} from 'shared/store/Reducers'


import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore,
	addActionInterceptor,
	IActionInterceptorNext
} from 'typedux'

import {
	readFile,
	writeFile,
	writeFileAsync, getUserDataFilename
} from 'shared/util/Files'

import {
	loadActionFactories
} from 'shared/actions/ActionFactoryProvider'
import {OnlyIfFn, If} from "shared/util/Decorations"
import {isString} from "shared/util"
import { getHot, setDataOnHotDispose } from "shared/util/HotUtils"
import { IChildStore, IChildStoreSubscriptionManager, ChildStoreSubscriptionStatus } from "shared/store/ChildStore"
import { attachChildStore } from "shared/AppStoreClient"
import { RepoState } from "shared/actions/repo/RepoState"


const
	log = getLogger(__filename),
	stateFilename = getUserDataFilename('epictask-store-state.json'),
	ActionLoggerEnabled = false


// HMR - setup
let
	hmrReady = false,
	hmrDisposed = false,
	interceptorInstalled = false

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Install action interceptor for child
 *
 * @param childStoreManager
 */
function installActionInterceptor(childStoreManager:IChildStoreSubscriptionManager) {
	// MAKE SURE THE INTERCEPTOR IS INSTALLED FOR CHILD STORES
	// - INTERCEPTS ACTIONS (NOT REDUCER ACTIONS)
	// - PUSHES TO ROOT STORE
	If(!interceptorInstalled && !ProcessConfig.isType(ProcessType.UI),() => {
		
		interceptorInstalled = true
		
		const
			unregisterInterceptor = addActionInterceptor(
				({leaf,type,options}, next:IActionInterceptorNext, ...args:any[]) => {
					
					// Push it to the server
					childStoreManager.sendAction({leaf,type,args})
					
					// If it's a reducer then process it, otherwise - wait for server
					// to process the action and send data
					return (options && options.isReducer) ? next() : null
					
				}
			)
		
		if (module.hot) {
			module.hot.dispose(() => {
				log.info(`HMR Removing action interceptor`)
				unregisterInterceptor()
			})
		}
	})
}


/**
 * Create the appropriate middleware
 *
 * @returns {any}
 */
function createMiddleware() {
	return [thunkMiddleware]
}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const
	middleware = getHot(module,'middleware',createMiddleware())


let
	store:ObservableStore<any> = _.get(module.hot,'data.store') as any,
	persistingState = false

// Check for hot reload
If(store,() => {
	hmrSetup()
	updateReducers()
})



/**
 * onChange event of store
 */
function onChange() {
	log.debug(`Store state changed`)
	persistStoreState(getStoreState())
}

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
function onError(err:Error,reducer?:ILeafReducer<any,any>) {
	const
		toaster = getToaster()
	
	log.error('Reducer error occurred',reducer,err,err.stack)
	setImmediate(() => {
		toaster.addErrorMessage(err)
	})
	
}


function updateReducers() {
	getStore().replaceReducers(...getReducers())
}

/**
 * Setup HMR for the store
 */
function hmrSetup() {
	if (!Env.isRenderer && module.hot && !hmrReady) {
		hmrReady = true
		
		module.hot.accept(['./Reducers'],(updates) => {
			log.info(`Reducer Updates received, reloading reducers`, updates)
			
			updateReducers()
		})
	}
}

/**
 * Initialize/Create the store
 */
function initStore(devToolsMode = false,defaultState = null) {

	const
		enhancers = [
			applyMiddleware(...middleware)
		]
	
	// ADD AppStoreEnhancer to broadcast to children only in UI process
	if (ProcessConfig.isType(ProcessType.UI)) {
		enhancers.push(require('./AppStoreEnhancer').default)
	}

	// if (Env.isDev && Env.isRenderer && ActionLoggerEnabled) {
	// 	enhancers.push(applyMiddleware(createLogger()))
	// }

	/**
	 * Redux Dev Tooling
	 *
	 * @type {function(): *}
	 */
	if ((Env.isDev && !Env.isTest) || (Env.isDev && window.devToolsExtension)) {
		require('./AppStoreDevConfig').default(enhancers)
	}
	

	let
		reducers = getReducers()

	// CREATE STORE
	const
		newStore = ObservableStore.createObservableStore(
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
 * A store specifically for testing & storybook
 */
export function loadAndInitStorybookStore() {
	const enhancers = [applyMiddleware(...middleware)]
	
	//enhancers.push(applyMiddleware(createLogger()))
	
	require('./AppStoreDevConfig').default(enhancers)
	
	const reducers = getReducers()
	log.info(`Creating story book with reducers`, reducers)
	// Create the store
	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose.call(null,...enhancers) as StoreEnhancer<any>,
		null
	)
	
	// If HMR enabled then prepare for it
	hmrSetup()
	
	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)
	
	store = newStore
	setStoreProvider(newStore)
	loadActionFactories()
	newStore.dispatch({type: "@INIT"})
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
		try {
			// If state server then try and load from disk
			const
				stateJson = readFile(stateFilename)
			
			if (stateJson) {
				let
					count = 0,
					stateData = stateJson
				
				while (isString(stateData) && count < 3) {
					stateData = JSON.parse(stateData)
				}
				
				defaultStateValue = stateData
				//log.info(`Read state from file`, JSON.stringify(defaultStateValue[ UIKey ], null, 4))
			}
		} catch (err) {
			log.error('unable to load previous state data, starting fresh', err)
		}
	}
	
	return initStore(false,defaultStateValue)
}


/**
 * Create a child store that connects to the root process
 *
 * @returns {ObservableStore<any>}
 */
export async function loadAndInitChildStore() {
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
				}else {
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
		manager.onStatusChange((status:ChildStoreSubscriptionStatus,err:Error = null) => {
			log.info(`Child store state changed`,status,err)
		})
		
		installActionInterceptor(manager)
		
		const
			preStore = await loadAndInitStore(initialState)
		
		while (pendingMessages.length) {
			const
				nextMsg = pendingMessages.shift()
			
			preStore.dispatch(nextMsg)
		}
		
		//noinspection JSUnusedAssignment
		childReduxStore = preStore
	}	catch (err) {
		log.error(`Failed to start the child store - this is bad`,err)
		throw err
	}
	
	return store
	
}




/**
 * Write the actual state async
 */
function writeStoreState(state = getStoreState(),doAsync = false) {
	if (!ProcessConfig.isType(ProcessType.UI))
		return Promise.resolve()
	
	log.info(`Writing current state to: ${stateFilename}`)
	if (persistingState) {
		log.info('Persisting, can not persist until completion')
		return
	}
	
	persistingState = true
	
	if (doAsync)
		return Promise
			.resolve(writeFileAsync(stateFilename,serializeState(state)))
			.catch(err => {
				log.error('state persistence failed',err)
			})
			.finally(() => persistingState = false)
	
	try {
		
		// TODO: Add Storage store filter
		
		//writeFile(stateFilename, serializeState(state))
		const
			js = _.toJS(state),
			repoState = _.get(js,RepoKey,null) as RepoState
		
		if (repoState && repoState.availableRepos)
			delete repoState['availableRepos']
		
		
		
		writeFile(stateFilename, JSON.stringify(js))
	} catch (err) {
		log.error(`Failed to persist store state`,err)
	}
	persistingState = false
	return Promise.resolve()
}

/**
 * Is persistence allowed
 * @returns {any|boolean}
 */
function canPersistState() {
	const
		canPersist = ProcessConfig.isType(ProcessType.UI) && !hmrDisposed
	
	if (!canPersist)
		log.debug(`Can not persist state in process=${ProcessConfig.getTypeName()} hmrDisposed=${hmrDisposed}`)
	
	return canPersist
		
}

/**
 * Debounced persist store state call
 */
const persistStoreState = OnlyIfFn(canPersistState,_.debounce((state) => {
	writeStoreState(state,true)
},10000,{
	maxWait:30000
}))

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
If(DEBUG,() => {
	_.assignGlobal({
		getStore,
		getStoreState
	})
})

/**
 * Serialize the current state as a string
 *
 * @returns {string}
 */
export function serializeState(state = getStoreState(), filter = null) {
	return JSON.stringify(_.toJS(state))
}


// Just in case its an hmr request
const
	existingRemoveListener = getHot(module,'removeListener') as Function

if (existingRemoveListener)
	existingRemoveListener()








// On unload write the state
if (typeof window !== 'undefined' && ProcessConfig.isUI) {
	window.addEventListener('beforeunload', () => {
		log.info(`Writing current state (shutdown) to: ${stateFilename}`)
		writeStoreState()
	})
}

// app.on('before-quit',() => {
//
// })


setDataOnHotDispose(module,() => ({
	store,
	middleware
}))

if (module.hot) {
	// On dispose, save current middleware and store
	module.hot.addDisposeHandler(() => {
		hmrDisposed = true
	})
		
	
	module.hot.accept(() => log.info(`HMR update`,__filename))
}