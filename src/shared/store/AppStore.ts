
import thunkMiddleware from 'redux-thunk'
import {Store as ReduxStore} from 'redux'
import {Map} from 'immutable'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {ReduxDebugSessionKey, UIKey} from 'shared/Constants'
import {Toaster} from 'shared/Toaster'
import {getReducers} from 'shared/store/Reducers'
import {ipcRenderer} from 'electron'

import {
	getAction,
	getAllActions,
	setStoreProvider,
	ILeafReducer,
	ObservableStore
} from 'typedux'

import {
	cacheFilename,
	readFile,
	writeFile,
	writeFileAsync, getUserDataFilename
} from 'shared/util/Files'

import {
	loadActionFactories, ActionFactoryProviders
} from 'shared/actions/ActionFactoryProvider'
import {makeReactotronEnhancer} from "shared/store/AppStoreDevConfig"
import {OnlyIfFn, If} from "shared/util/Decorations"
import {isString} from "shared/util"
import { addGlobalListener, default as ChildProcessWebView } from "shared/ChildProcessWebView"
import { getHot, setDataOnDispose } from "shared/util/HotUtils"

const
	log = getLogger(__filename),
	stateFilename = getUserDataFilename('store-state'),
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
	return [thunkMiddleware]
}

/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = _.get(module,'module.hot.data.middleware',createMiddleware())


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
function initStore(devToolsMode = false,defaultState = null) {

	const enhancers = [
		applyMiddleware(...middleware)
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

	// Create the store/*
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

export async function loadAndInitStore() {
	loadActionFactories()
	
	let defaultStateValue = null
	
	
	try {
		// If state server then try and load from disk
		const stateJson = readFile(stateFilename)
		
		if (stateJson) {
			let
				count = 0,
				stateData = stateJson
			
			while (isString(stateData) && count < 3) {
				stateData = JSON.parse(stateData)
			}
			
			defaultStateValue = stateData
			log.info(`Read state from file`,JSON.stringify(defaultStateValue[UIKey],null,4))
		}
	} catch (err) {
		log.error('unable to load previous state data, starting fresh', err)
	}

	return initStore(false,defaultStateValue)
}



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
const {app} = require('electron')

// Just in case its an hmr request
const existingRemoveListener = getHot(module,'removeListener')
if (existingRemoveListener)
	existingRemoveListener()


/**
 * Map of existing observers
 *
 * @type {any}
 */
const clientObservers = getHot(module,'clientObservers',{})


function getStateValue(...keyPath) {
	let val = getStoreState()
	
	for(let key of keyPath) {
		if (!val)
			break
		
		let nextVal = _.isFunction(val.get) && val.get(key)
		if (!nextVal)
			nextVal = val[key]
		
		val = nextVal
	}
	
	return val
}

interface IMessageSender {
	sendMessage(type:string,body)
}

/**
 * All message handlers
 */
const clientMessageHandlers = {
	
	stateRequest(childProcess:IMessageSender,{id,keyPath}) {
		const
			state = getStoreState(),
			rawValue = getStateValue(...keyPath),
			value = _.toJS(rawValue)
		
		log.info(`Getting state value`,id,keyPath,rawValue,value)
		
		childProcess.sendMessage('stateResponse',{
			id,
			value
		})
	},
	
	/**
	 * Handle observer request
	 *
	 * @param childProcess
	 * @param id
	 * @param keyPath
	 */
	observeStateRequest(childProcess:IMessageSender,{id,keyPath}) {
		
		let
			lastValue = null
		
		const
			handler = (newValue,oldValue) => {
				if (lastValue) {
					oldValue = lastValue
				}
				
				lastValue = newValue = _.toJS(newValue)
				childProcess.sendMessage('observeStateChange',{id,newValue,oldValue})
			}
		
		try {
			clientObservers[ id ] = {
				id,
				childProcess,
				keyPath,
				remover: getStore().observe(keyPath, handler)
			}
			
			childProcess.sendMessage('observeStateResponse',{id})
		} catch (err) {
			log.error(`Unable to create observer`,err)
			childProcess.sendMessage('observeStateResponse',{id,err})
		}
	},
	
	/**
	 * Stop watching state changes
	 *
	 * @param childProcess
	 * @param id
	 * @returns {any|{fontWeight}|{color}|void}
	 */
	observeStateRemove(childProcess:IMessageSender,{id}) {
		const observer = clientObservers[id]
		
		if (!observer)
			return log.warn(`Unable to find observer with id ${id}, can not remove`)
		
		observer.remover()
		delete clientObservers[id]
	},
	
	
	/**
	 * Action request from client server (db/job)
	 *
	 * @param childProcess
	 * @param type
	 * @param leaf
	 * @param args
	 */
	actionRequest(childProcess:IMessageSender,{type,leaf,args}) {
		log.info(`Received action request: `, leaf,type,args)
		const actions = ActionFactoryProviders[leaf]
		// const actionReg = getAction(leaf,type)
		if (!actions || !actions[type]) {
			const msg = `Unable to find action ${leaf}.${type} in ${Object.keys(getAllActions()).join(', ')}`
			log.warn(msg,getAllActions())
			throw new Error(msg)
		}
		
		actions[type].apply(actions,args)
		//
		// //if (actionReg.options.isReducer)
		// actionReg.action(null,...args)
	}
}

// Subscribe for remote client action requests
const removeListener = addGlobalListener({
	
	/**
	 * On client message
	 *
	 * @param childProcess
	 * @param type
	 * @param body
	 */
	onMessage(childProcess:ChildProcessWebView,{type,body}) {
		
		const
			handler = clientMessageHandlers[type]
		
		if (!handler) {
			log.error(`Unknown message type ${type}`)
			return
		}
		
		handler(childProcess,body)
	}
})

Object
	.keys(clientMessageHandlers)
	.forEach(type => {
		if (ipcRenderer)
			ipcRenderer.on(type,(event,body) => {
				clientMessageHandlers[type]({
					sendMessage(type,body) {
						ipcRenderer.send(type,body)
					}
				},body)
			})
	})

// On unload write the state
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		log.info(`Writing current state (shutdown) to: ${stateFilename}`)
		writeStoreState()
		//removeListener()
	})
}
// app.on('before-quit',() => {
//
// })


setDataOnDispose(module,() => ({
	store,
	middleware,
	removeListener,
	clientObservers
}))

if (module.hot) {
	// On dispose, save current middleware and store
	module.hot.addDisposeHandler(() => {
		hmrDisposed = true
	})
		
	
	module.hot.accept(() => log.info(`HMR update`,__filename))
}