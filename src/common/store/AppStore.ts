/* eslint-disable */

import * as _ from "lodash"
import {applyMiddleware, compose, Middleware, Store as ReduxStore, StoreEnhancer} from "redux"
import thunkMiddleware from "redux-thunk"
import {ILeafReducer, ObservableStore, setStoreProvider, State} from "typedux"
import {getHot, setDataOnHotDispose} from "common/HotUtil"

import getLogger from 'common/log/Logger'
import {StringMap} from "common/Types"
import {AppState} from "./state/AppState"
import {DataState} from "./state/DataState"

//import {isMain, isRenderer} from "common/Process"
//import createHistory from "history/createHashHistory"



// Create the global store as an ObservableStore (from typedux) which implements Redux store under the hood
// The store here will listen for changes to the store/ directory and update as there are changes
let store:ObservableStore<any> = getHot(module, "store",null) as any

const
	log = getLogger(__filename),
  middleware = getHot(module, "middleware", createMiddleWare) as any
  //history = process.env.isMainProcess ? null : getHot(module, 'history', require('history/createHashHistory').default) as any

let hmrReady = false

function createMiddleWare():Middleware[] {
	const middleware = [thunkMiddleware]
	if (!process.env.isMainProcess) {
		const { routerMiddleware} = require('react-router-redux')
		middleware.push(routerMiddleware(history))
	}
	return middleware
}

/**
 * Setup HMR for the store and reducers
 * HMR is made available through Webpack
 */
function hmrReducerSetup():void {
	if (module.hot && !hmrReady) {
		hmrReady = true
		// When ./Reducers is updated, fire off updateReducers
		const stateModules = ["./state/AppState","./state/DataState"]
		if (!process.env.isMainProcess) {
			stateModules.push("renderer/store/state/UIState")
		}
		module.hot.accept(stateModules, updateReducers)
	}
}

/**
 * Update the store with the new/updated reducers
 */
export async function updateReducers():Promise<void> {
	log.debug("Updating reducers")
	// The reducers have changed and a HMR was detected.  Let"s reload the reducers and pickup the updated ones
	getStore().replaceReducers(...(await loadReducers()))
}

export async function loadReducers():Promise<Array<ILeafReducer<any,any>>> {
	const reducers = [
		...ObservableStore.makeSimpleReducers(new AppState(), new DataState())
	]

	if (!process.env.isMainProcess) {
		reducers.unshift(require('react-router-redux').routerReducer)

		const
			rendererStates = [require("renderer/store/state/UIState")],
			rendererReducers = ObservableStore.makeSimpleReducers(
				...rendererStates.map(mod => new (mod.default)())
			)

		reducers.push(...rendererReducers)
	}

	return reducers
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

let reduxLoggingEnabled = false
function setReduxLoggingEnabled(enabled:boolean) {
	reduxLoggingEnabled = enabled
}

const logger = store => next => action => {
  if (reduxLoggingEnabled) {
    console.group('dispatching', action)
    console.log('current state', store.getState())
  }

  let result = next(action)

	if (reduxLoggingEnabled) {
    console.log('next state', store.getState())
    console.groupEnd()
  }

  return result
}

const crashReporter = store => next => action => {
  try {
    return next(action)
  } catch (err) {
    log.error('Caught an exception!', err)
    throw err
  }
}

async function initStore(devToolsMode:boolean = false):Promise<ObservableStore<IRootState>> {
	const
		allMiddleware = [...(process.env.isMainProcess ? [] : [logger]),...middleware],
		enhancers = [
			applyMiddleware(...allMiddleware)
		]


  if (process.env.isMainProcess) {
  	enhancers.push(require("./enhancers/MainEnhancer").default)
	} else {
    enhancers.push(require("./enhancers/RendererEnhancer").default)
    const addDevMiddleware = require("./AppStoreDevConfigs").default
    addDevMiddleware(enhancers)
	}

	// Add redux as a dev tool in develop window


	const reducers = await loadReducers()
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

	// const
	// 	ctx = require.context('./actions',true,/\.ts$/)
	//
	// // Load All Mods
	// ctx.keys().forEach(ctx)

	return store
}

/**
 * Load the store from disk and setup
 * @returns {ObservableStore<any>}
 */
export async function loadAndInitStore():Promise<ObservableStore<IRootState>> {
	return await initStore(false)
}

// const history = isMain() ? null : getHot(module, 'history', require('history/createHashHistory').default) as any
//
// /**
//  * Get the history setup from npm history
//  */
// export function getRouterHistory() {
//   // import createHistory from 'history/createHashHistory'
//   // import {History,LocationState} from "history"
//   // history:History<LocationState> = isMain() ? null : getHot(module, 'history', createHistory) as any,
// 	return history
// }

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
//	getRouterHistory, // used by ConnectedRouter
})




setDataOnHotDispose(module, () => ({
	store,
	history,
	middleware
}))
