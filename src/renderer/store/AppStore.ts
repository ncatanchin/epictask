/* eslint-disable */
import createHistory from 'history/createHashHistory'
import * as _ from "lodash"
import {applyMiddleware, compose, Middleware, Store as ReduxStore, StoreEnhancer} from "redux"
import thunkMiddleware from "redux-thunk"
import {ILeafReducer, ObservableStore, setStoreProvider, State} from "typedux"
import { routerMiddleware, routerReducer} from 'react-router-redux'
import {getHot, setDataOnHotDispose} from "common/HotUtil"
import addDevMiddleware from "./AppStoreDevConfigs"
import getLogger from 'common/log/Logger'
import {StringMap} from "common/Types"
import {AppState} from "./state/AppState"
import {DataState} from "renderer/store/state/DataState"
import {History,LocationState} from "history"



// Create the global store as an ObservableStore (from typedux) which implements Redux store under the hood
// The store here will listen for changes to the store/ directory and update as there are changes
let store:ObservableStore<any> = getHot(module, "store") as any

const
	log = getLogger(__filename),
	history:History<LocationState> = getHot(module, 'history', createHistory) as any,
	middleware = getHot(module, "middleware", createMiddleWare) as any

let hmrReady = false

function createMiddleWare():Middleware[] {
	return [thunkMiddleware, routerMiddleware(history)]
}

/**
 * Setup HMR for the store and reducers
 * HMR is made available through Webpack
 */
function hmrReducerSetup():void {
	if (module.hot && !hmrReady) {
		hmrReady = true
		// When ./Reducers is updated, fire off updateReducers
		module.hot.accept(["./state/AppState","./state/DataState"], updateReducers)
	}
}

/**
 * Update the store with the new/updated reducers
 */
export function updateReducers():void {
	log.debug("Updating reducers")
	// The reducers have changed and a HMR was detected.  Let"s reload the reducers and pickup the updated ones
	getStore().replaceReducers(...loadReducers())
}

export function loadReducers():Array<ILeafReducer<any,any>> {
	return [
		routerReducer as any,
		...ObservableStore.makeSimpleReducers(new AppState(), new DataState())
	]
}

/**
 * Get the ObservableStore
 * @returns {ObservableStore<any>}
 */
export function getStore():ObservableStore<any> {
	return store
}

/**
 * Retrieve redux store from the regular ObservableStore
 * @returns {Store<Map<string, any>>}
 */
export function getReduxStore():ReduxStore<Map<string, any>> {
	return getStore() && getStore().getReduxStore()
}

/**
 * Get the current state
 *
 * @returns {Map<string,any>}
 */
export function getStoreState():StringMap<any> & IRootState {
	return getStore() ? getStore().getState() : {}
}

function initStore(devToolsMode:boolean = false):ObservableStore<any> {
	const enhancers = [applyMiddleware(...middleware)]
	
	// Add redux as a dev tool in develop window
	addDevMiddleware(enhancers)
	
	const reducers = loadReducers()
	const newObservableStore:ObservableStore<any> = ObservableStore.createObservableStore(
		reducers,
		compose.call(null, ...enhancers) as StoreEnhancer<any>,
		null,
		null,
	)
	
	hmrReducerSetup()
	
	newObservableStore.rootReducer.onError = onError
	
	// Set the global store defined above
	store = newObservableStore
	
	//(Typedux) so that components are able to access state from connectors
	setStoreProvider(newObservableStore)
	
	const
		ctx = require.context('./actions',true,/\.ts$/)
	
	// Load All Mods
	ctx.keys().forEach(ctx)
	
	
	log.info("Reading persisted data back into storeState")
	//Object.assign(newObservableStore.getState(), loadState(newObservableStore.getState()))
	return store
}

/**
 * Load the store from disk and setup
 * @returns {ObservableStore<any>}
 */
export function loadAndInitStore():ObservableStore<IRootState> {
	return initStore(false)
}

/**
 * Get the history setup from npm history
 */
export function getRouterHistory():History<LocationState> {
	return history
}

/**
 * Log an error when it occurs in the reducer
 * @param {Error} err
 * @param {ILeafReducer<any, any>} reducer
 */
function onError(err:Error, reducer?:ILeafReducer<any, any>):void {
	log.error("Reducer error occurred", reducer, err, err.stack)
}

_.assign(global, {
	getReduxStore,
	getStore,
	getStoreState,
	getRouterHistory, // used by ConnectedRouter
})

declare global {
	
	interface IRootState extends State<string> {
		AppState:AppState
		DataState:DataState
	}
	
	function getReduxStore():ReduxStore<IRootState>
	
	function getStore():ObservableStore<any>
	
	function getStoreState():StringMap<any> & IRootState
	
	function getRouterHistory()
	
	interface Window {
		devToolsExtension:any
	}
}


setDataOnHotDispose(module, () => ({
	store,
	history,
	middleware
}))
