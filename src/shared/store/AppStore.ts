
import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import {Store as ReduxStore} from 'redux'
import {Map} from 'immutable'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Container} from 'typescript-ioc'
import {ReduxDebugSessionKey, UIKey} from 'shared/Constants'
import {Toaster} from 'shared/Toaster'
import {getReducers} from 'shared/store/Reducers'

import {getServerClient} from "shared/server/ServerClient"

import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore
} from 'typedux'

import {
	writeJSONFileAsync,
	cacheFilename,
	readFile,
	writeJSONFile, writeFile, writeFileAsync
} from 'shared/util/Files'

import {
	loadActionFactories
} from 'shared/actions/ActionFactoryProvider'
import {makeReactotronEnhancer} from "shared/store/AppStoreDevConfig"
import {OnlyIf, OnlyIfFn, If} from "shared/util/Decorations"
import {isString} from "shared/util"

const
	log = getLogger(__filename),
	stateFilename = cacheFilename('store-state'),
	ActionLoggerEnabled = false


// HMR - setup
let
	hmrReady = false,
	hmrDisposed = false

/**
 * Create the appropriate middleware
 *
 * @returns {any}
 */
function createMiddleware() {
	return If(
		Env.isRenderer,
		() => [],
		() => [thunkMiddleware]
	)
	

}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = _.get(module,'module.hot.data.middleware',createMiddleware())


let store:ObservableStore<any> = _.get(module.hot,'data.store') as any

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
	const toaster = Container.get(Toaster)
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
function initStore(devToolsMode = false,defaultState = null,storeEnhancer = null) {

	const enhancers = [
		applyMiddleware(...middleware),
		storeEnhancer || require('./ClientStoreEnhancer').default
	]

	// if (Env.isDev && Env.isRenderer && ActionLoggerEnabled) {
	// 	enhancers.push(applyMiddleware(createLogger()))
	// }

	/**
	 * Redux Dev Tooling
	 *
	 * @type {function(): *}
	 */
	if (Env.isDev && !Env.isTest) {
		require('./AppStoreDevConfig').default(enhancers)
	}
	

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
 * A store specifically for testing & storybook
 */
export function loadAndInitStorybookStore() {
	const enhancers = [makeReactotronEnhancer(),applyMiddleware(...middleware)]
	
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
 * @returns {ObservableStore<any>}
 */

export async function loadAndInitStore(serverStoreEnhancer = null) {
	loadActionFactories()
	
	let defaultStateValue = null
	
	// If state server then try and load from disk
	
	if (serverStoreEnhancer) {
		const stateJson = readFile(stateFilename)
		try {
			let stateData
			if (stateJson) {
				let count = 0
				let stateData = stateJson
				while (isString(stateData) && count < 3) {
					stateData = JSON.parse(stateData)
				}
				
				defaultStateValue = stateData
				log.info(`Read state from file`,JSON.stringify(defaultStateValue[UIKey],null,4))
			}
		} catch (err) {
			log.error('unable to load previous state data, starting fresh', err)
		}
	}
	
	// Otherwise load from server
	else {
		log.info(`Loading state from server`)
		defaultStateValue = await getServerClient().getState()
		log.info(`Got state from server`,defaultStateValue.get(UIKey).toolPanels.toJS())
	}
	
	const newStore = initStore(false,defaultStateValue,serverStoreEnhancer)
	
	const newState = newStore.getState()
	log.info(`Store Created with tool panels`,JSON.stringify(newState.get(UIKey).toolPanels.toJS(),null,4))
	
	return newStore
}


let persistingState = false

/**
 * Write the actual state async
 */
function writeStoreState(state = getStoreState(),doAsync = false) {
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
		writeFile(stateFilename, serializeState(state))
	} catch (err) {
		log.error(`Failed to persist store state`,err)
	}
	persistingState = false
	return Promise.resolve()
}


function canPersistState() {
	const canPersist = ProcessConfig.isMain() && !hmrDisposed
	if (!canPersist)
		log.debug(`Can not persist state isMain=${ProcessConfig.isMain()} hmrDisposed=${hmrDisposed}`)
	return canPersist
		
}

/**
 * Debounced persist store state call
 */
const persistStoreState = OnlyIfFn(canPersistState,_.debounce((state) => {
	writeStoreState(state,true)
},10000,{maxWait:30000}))

/**
 * Get the observable store
 *
 * @returns {ObservableStore<any>}
 */
export function getStore() {
	if (!store) {
		// initStore()
		return null
	}
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
If(Env.isDev,() => {
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
export function serializeState(state = getStoreState()) {
	return JSON.stringify(_.toJS(state))
}

// Add shutdown hook on main
If(ProcessConfig.isMain,() => {
	log.info(`Main is shutting down, going to persist state`)
	
	const {app} = require('electron')
	app.on('before-quit',() => {
		log.info(`Writing current state (shutdown) to: ${stateFilename}`)
		writeStoreState()
	})
})


if (module.hot) {
	module.hot.dispose((data:any) => {
		assign(data,{store,middleware})
		hmrDisposed = true
	})
	
	module.hot.accept()
}