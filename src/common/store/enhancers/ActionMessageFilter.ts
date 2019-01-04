import { ActionMessage } from "typedux"
import {getValue, isFunction} from "typeguard"
import {AppStoreSyncKeys} from "common/store/AppStoreTypes"
import * as assert from 'assert'

/**
 * Options, none yet ;)
 */
export interface IActionFilterOptions {

}


/**
 * Message handler shape
 */
export interface IActionMessageHandler<M,R> {
	(action:ActionMessage<M>):R
}

function makeMessageFilterHandler<M,R>(options,handler:IActionMessageHandler<M,R>):IActionMessageHandler<M,R> {
	return (action:ActionMessage<M>):R => {
		const
			leaf = getValue(() => action.leaf)
		
		if (!AppStoreSyncKeys.includes(leaf))
			return null
		
		return handler(action)
	}
}



export function ActionMessageFilter<M,R>(
	options:IActionFilterOptions
):(handler:IActionMessageHandler<M,R>) => IActionMessageHandler<M,R>
export function ActionMessageFilter<M,R>(handler:IActionMessageHandler<M,R>):IActionMessageHandler<M,R>
export function ActionMessageFilter<M,R>(options:IActionFilterOptions, handler:IActionMessageHandler<M,R>):IActionMessageHandler<M,R>
export function ActionMessageFilter<M,R>(handlerOrOptions:IActionFilterOptions|IActionMessageHandler<M,R>,handler:IActionMessageHandler<M,R> = null):IActionMessageHandler<M,R> | ((handler:IActionMessageHandler<M,R>) => IActionMessageHandler<M,R>) {
	if (handlerOrOptions && !isFunction(handlerOrOptions) && !handler) {
		return ((finalHandler:IActionMessageHandler<M,R>) =>
			makeMessageFilterHandler(handlerOrOptions,finalHandler))
			
	}
	
	handler = (isFunction(handlerOrOptions) && handlerOrOptions) || handler
	assert(handler && isFunction(handler),`Could not determine handler`)
	
	const
		options = (handlerOrOptions && handlerOrOptions !== handler && handlerOrOptions) || {}
	
	return makeMessageFilterHandler(options, handler)
	
	
	
}
