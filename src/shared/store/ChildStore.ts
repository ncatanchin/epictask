import {ActionMessage} from 'typedux'
import {Action} from 'redux'

export enum ChildStoreFilterType {
	Include,
	Exclude
}

export interface IChildStoreKeyPathFilter {
	type:ChildStoreFilterType
	keyPath:string|string[]
}

export interface IChildStoreKeyFilter {
	defaultType?:ChildStoreFilterType
	keyPathFilters?: IChildStoreKeyPathFilter[]
}


export interface IChildStoreFilter {
	[key:string]: IChildStoreKeyFilter
}

/**
 * Child store shape
 */
export interface IChildStore {
	dispatch(action:Action)
	setState(state:any)
	filter?:IChildStoreFilter
}

/**
 * Subscription status
 */
export enum ChildStoreSubscriptionStatus {
	Starting = 1,
	Running,
	Stopped,
	Failed
}


/**
 * Listener shape for child store
 */
export type TChildStoreSubscriptionStatusListener = (status:ChildStoreSubscriptionStatus,err?:Error) => any

/**
 * Detach from parent store
 */
export interface IChildStoreSubscriptionManager {
	detach():void
	sendAction(action):void
	getStatus():ChildStoreSubscriptionStatus
	onStatusChange(listener:TChildStoreSubscriptionStatusListener)
}


