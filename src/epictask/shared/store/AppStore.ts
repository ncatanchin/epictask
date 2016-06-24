import {requireContext} from '../util/ContextUtils'
const log = getLogger(__filename)

import * as Immutable from 'immutable'
import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {Events, ReduxDebugSessionKey} from 'shared/Constants'
import {AppActionFactory as AppActionFactoryType} from 'shared/actions/AppActionFactory'
import {getReducers} from './Reducers'
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
		ipc.send(Events.StoreRendererDispatch,leaf,name,args)
		return
	})
}

//const reduxLogger = createLogger();

let hmrReady = false

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
	const AppActionFactory:typeof AppActionFactoryType = require('shared/actions').AppActionFactory

	const actions = new AppActionFactory()
	actions.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
function initStore() {

	const devTools = [devToolsMiddleware]
	// if (Env.isDev && Env.is) {
	// 	const statePersistence = require('redux-devtools').persistState(getDebugSessionKey())
	// 	devTools.push(statePersistence)
	// }

	let reducers = (Env.isRenderer) ? [] : getReducers()

	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose(
			applyMiddleware(...middleware),
			storeEnhancer,
			devToolsMiddleware
		) as StoreEnhancer<any>
	)

	// If HMR enabled then prepare for it
	if (!Env.isRenderer && module.hot && !hmrReady) {
		hmrReady = true

		module.hot.accept(['./Reducers'],(updates) => {
			log.info(`Reducer Updates received, reloading reducers`,
				updates)

			getStore().replaceReducers(...getReducers())
		})
	}

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)

	return store
}


export async function createStore() {
	return initStore()

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

//
// if (module.hot) {
// 	module.hot.accept(['./MainStoreEnhancer','./RenderStoreEnhancer'],(updates) => {
// 		log.info('enhancer changed',updates)
//
// 	})
// }
