
import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Container} from 'typescript-ioc'
import {ReduxDebugSessionKey} from 'shared/Constants'
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
	writeJSONFile
} from 'shared/util/Files'

import {
	loadActionFactories
} from 'shared/actions/ActionFactoryProvider'
import {ProcessType} from "shared/ProcessType"


const log = getLogger(__filename)

const stateFilename = cacheFilename('store-state')
const ActionLoggerEnabled = false


// /**
//  * Reference to server client when loaded
//  *
//  * @type {ServerClient}
//  */
//let serverClient:ServerClient = null

// function getServerClient() {
// 	if (!serverClient)
// 		serverClient = require('shared/server/ServerClient').getServerClient() as ServerClient
//
// 	return serverClient
// }


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


let store:ObservableStore<any>

/**
 * onChange event of store
 */
function onChange() {
	log.debug(`Store state changed`)
	//persistStoreState(getStoreState())
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
	log.error('Reducer error occurred',err,reducer)
	setImmediate(() => {
		toaster.addErrorMessage(err)
	})
	
}

/**
 * Initialize/Create the store
 */
export function initStore(devToolsMode = false,defaultState = null,storeEnhancer = null) {

	const enhancers = [
		applyMiddleware(...middleware),
		storeEnhancer || require('./ClientStoreEnhancer').default
	]

	if (Env.isDev && Env.isRenderer && ActionLoggerEnabled) {
		enhancers.push(applyMiddleware(createLogger()))
	}

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
 * Load existing state from disk
 *
 * @returns {ObservableStore<any>}
 */
export async function loadAndInitStore(serverStoreEnhancer = null) {
	loadActionFactories()
	
	let defaultStateValue = null
	
	// If state server then try and load from disk
	
	if (serverStoreEnhancer) {
		const stateData = readFile(stateFilename)
		try {
			if (stateData)
				defaultStateValue = JSON.parse(stateData)
		} catch (err) {
			log.error('unable to load previous state data, starting fresh', err)
		}
	}
	
	// Otherwise load from server
	else {
		defaultStateValue = await getServerClient().getState()
	}
	
	return initStore(false,defaultStateValue,serverStoreEnhancer)
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
		// initStore()
		return null
	}
	return store
}

export function getReduxStore() {
	return getStore() && getStore().getReduxStore()
}

export function getStoreState() {
	return getStore() ? getStore().getState() : Immutable.Map()
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
	//assert(Env.isMain,'Can only persist on main')
	const
		stateJS = _.toJS(getStoreState()),
		stateJson = JSON.stringify(stateJS)
	
	if (doAsync)
		writeJSONFileAsync(stateFilename,stateJson)
	else
		writeJSONFile(stateFilename,stateJson)

}

