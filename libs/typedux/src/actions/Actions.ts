
const log = getLogger(__filename)

import {Store,Dispatch} from 'redux'
import {State} from '../reducers'


// Internal type definition for
// function that gets the store state
export type GetStoreState = () => State
export type DispatchState = Dispatch<State>

let registeredActions:any = {}

let actionInterceptors = []

/**
 * Reference to a dispatcher
 */
let dispatch:DispatchState

/**
 * Reference to store state
 */
let getStoreState:GetStoreState

/**
 * Get the current store state get
 * function - usually set when a new state is created
 *
 * @returns {GetStoreState}
 */
export function getStoreStateProvider():GetStoreState {
	return getStoreState
}

/**
 * Get the current store
 * dispatch function
 *
 * @returns {DispatchState}
 */
export function getStoreDispatchProvider():DispatchState {
	return dispatch
}

/**
 * Set the global store provider
 *
 * @param newDispatch
 * @param newGetState
 */
export function setStoreProvider(newDispatch:DispatchState|Store<State>,newGetState?:GetStoreState) {
	if (newGetState) {
		dispatch = newDispatch as DispatchState
		getStoreState = newGetState
	} else if (<Store<State>>newDispatch) {

		// Cast the guarded type
		const newStore = <Store<State>>newDispatch

		// Set and bind
		dispatch = newStore.dispatch.bind(newDispatch)
		getStoreState = newStore.getState.bind(newDispatch)
	}

	if (!dispatch || !getStoreState)
		throw new Error('Set store provider must include both dispatch and getState')
}

export interface IActionInterceptorNext {
	():any
}

export interface IActionInterceptor {
	(leaf:string,name:string,next:IActionInterceptorNext,...args:any[]):any
}

export function addActionInterceptor(interceptor:IActionInterceptor) {
	actionInterceptors.push(interceptor)

	return () => {
		_.remove(actionInterceptors,o => interceptor === o)
	}
}

function executeActionInterceptor(index:number,leaf:string,name:string,action:Function,args:any[]) {
	if (actionInterceptors.length > index) {
		return actionInterceptors[index](leaf,name,() => {
			return executeActionInterceptor(index + 1,leaf,name,action,args)
		},...args)
	} else {
		return action(...args)
	}
}

export function executeActionChain(leaf:string,name:string,action:Function,...args:any[]) {
	return executeActionInterceptor(0,leaf,name,action,args)
}

export function registerAction(actionFactory:any,leaf:string,name:string,action:Function) {
	registeredActions[`${leaf}:${name}`] = (...args) => {
		const actions = new actionFactory()
		return action.apply(actions,args)
	}
}


export function getAction(leaf:string,name:string) {
	return registeredActions[`${leaf}:${name}`]
}