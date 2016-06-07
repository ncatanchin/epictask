import {requireContext} from '../../shared/util/ContextUtils'
const log = getLogger(__filename)

import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'
import {AppActionFactory as AppActionFactoryType} from 'app/actions'

import {
	setStoreProvider,
	ILeafReducer,
	ObservableStore
} from 'typedux'


const reduxLogger = createLogger();


/**
 * DevToolsMiddleware is configured in DEBUG mode anyway
 *
 * @type {function(): *}
 */
const devToolsMiddleware =
	(!DEBUG) ? f => f :
	(window.devToolsExtension) ? window.devToolsExtension() :
	require('../components/debug/DevTools.tsx').instrument()


/**
 * Middleware includes thunk and in
 * DEBUG only + redux-logger + devtools
 *
 * @type {*[]}
 */
const middleware = [
	thunkMiddleware,
	reduxLogger
]


let store:ObservableStore<any>
let ctx:any

let hmrReady = false

function getReducers():ILeafReducer<any,any>[] {
	ctx = require.context('../actions',true,/Reducer\.ts$/)

	// If HMR enabled then prepare for it
	if (module.hot && !hmrReady) {
		hmrReady = true
		module.hot.accept([ctx.id],(updates) => {
			log.info('Updates received, reloading reducers',updates)
			getStore().replaceReducers(...getReducers())
		})
	}

	const mods = ctx.keys().map(ctx)


	const reducers = []
	mods.forEach(mod => {
		for (let key of Object.keys(mod)) {
			if (_.endsWith(key,'Reducer'))
				reducers.push(new (mod[key])())
		}
	})

	log.debug('Returning reducers',reducers)
	return reducers
}



function onChange() {
	log.debug(`Store state changed`)

}

function getDebugSessionKey() {
	// You can write custom logic here!
	// By default we try to read the key from ?debug_session=<key> in the address bar
	//const matches = window.location.href.match(/[?&]debug_session=([^&#]+)\b/);
	//return (matches && matches.length > 0)? matches[1] : null;
	return 'electron-debug-session'
}

function onError(err:Error,reducer?:ILeafReducer<any,any>) {
	const AppActionFactory:typeof AppActionFactoryType = require('app/actions').AppActionFactory

	const actions = new AppActionFactory()
	actions.addErrorMessage(err)
}

/**
 * Initialize/Create the store
 */
function initStore() {

	const devTools = [devToolsMiddleware]
	if (Env.isDev) {
		const statePersistence = require('redux-devtools').persistState(getDebugSessionKey())
		devTools.push(statePersistence)
	}

	const newStore = ObservableStore.createObservableStore(
		getReducers(),
		compose(applyMiddleware(...middleware), devToolsMiddleware) as StoreEnhancer<any>
	)

	newStore.rootReducer.onError = onError
	newStore.subscribe(onChange)

	store = newStore
	setStoreProvider(newStore)
}



export function getStore() {
	if (!store)
		initStore()

	return store
}

export function getReduxStore() {
	return getStore().getReduxStore()
}

