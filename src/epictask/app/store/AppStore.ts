import {requireContext} from '../../shared/util/ContextUtils'
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
	
	// const {AppReducer} = require('../actions/AppReducer')
	// const {AuthReducer} = require('../actions/auth')
	// const {RepoReducer} = require('../actions/repo')
	//const {RoutingReducer} = require('../routing')

	// const reducers = [
	// 	new AppReducer(),
	// 	new AuthReducer(),
	// 	new RepoReducer()
	// 	// ,new RoutingReducer()
	// ]

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

