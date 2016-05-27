const log = getLogger(__filename)

import thunkMiddleware from 'redux-thunk'
import * as createLogger from 'redux-logger'
import { StoreEnhancer,compose, applyMiddleware } from 'redux'

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
	require('../debug/DevTools.tsx').instrument()


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

function getReducers():ILeafReducer<any,any>[] {
	const {AppReducer} = require('../AppReducer')
	const {AuthReducer} = require('../auth')
	const {RoutingReducer} = require('../routing')
	
	const reducers = [
		new AppReducer(),
		new AuthReducer(),
		new RoutingReducer()
	]

	log.debug('Returning reducers',reducers)
	return reducers
}

function onChange() {
	log.debug(`Store state changed`)

}

/**
 * Initialize/Create the store
 */
function initStore() {
	const newStore = ObservableStore.createObservableStore(
		getReducers(),
		compose(applyMiddleware(...middleware), devToolsMiddleware) as StoreEnhancer<any>
	)
	//createStore(getReducers(), {}, compose(applyMiddleware(...middleware), devToolsMiddleware))
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