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



// function startRemoteDevServer() {
// 	if (Env.isDev && !Env.isRenderer) {
// 		const g = global as any
// 		if (!g.removeDevServerStarted) {
// 			g.removeDevServerStarted = true
// 			const remotedev = require('remotedev-server')
// 			remotedev({ hostname: 'localhost', port: 8787 })
// 		} else {
// 			console.log('Remote dev server already started')
// 		}
//
// 		console.log('remote redux dev server started at http://localhost:8787')
// 	}
// }
//
// if (Env.isDev && !Env.isRenderer)
// 	startRemoteDevServer()

if (Env.isRenderer) {
	addActionInterceptor((leaf:string,name:string,next:IActionInterceptorNext,...args:any[]) => {
		ipc.send(Events.StoreRendererDispatch,leaf,name,args)
		return
	})
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
 * Create remote dev tools enhancer
 *
 * @returns {any}
 */
function makeDevTools() {

	/**
	 * Make remote middleware
	 *
	 * @returns {Array<Middlware>}
	 */
	function makeRemoteMiddleware() {
		const remoteDevTools = require('remote-redux-devtools')
		return remoteDevTools({
			name: 'EpicTask - ' + ((Env.isRenderer) ? 'RENDERER' : 'MAIN'),
			realtime: true,
			hostname: 'localhost', port: 8787
		})
	}

	return (!Env.isDev) ? NullMiddleware :
			makeRemoteMiddleware()
}

/**
 * DevToolsMiddleware is configured in DEBUG mode anyway
 *
 * @type {function(): *}
 */
const devToolsMiddleware = makeDevTools()
	// (!Env.isDev) ? NullMiddleware :
	// 	(!Env.isRenderer) ? makeDevTools() :
	// 		(window.devToolsExtension) ? window.devToolsExtension() :
	// 			require('ui/components/debug/DevTools.tsx').DevTools.instrument()




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
export function initStore() {

	//const devTools = [devToolsMiddleware]
	// if (Env.isDev && Env.is) {
	// 	const statePersistence = require('redux-devtools').persistState(getDebugSessionKey())
	// 	devTools.push(statePersistence)
	// }

	let reducers = (Env.isRenderer) ? [] : getReducers()

	// Create the store
	const newStore = ObservableStore.createObservableStore(
		reducers,
		compose(
			applyMiddleware(...middleware),
			storeEnhancer,
			devToolsMiddleware
		) as StoreEnhancer<any>
	)

	// If HMR enabled then prepare for it
	hmrSetup()

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)

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
