import { ProcessClient, AppStoreServerName, getHot, setDataOnHotDispose } from "epic-global"
import * as uuid from "node-uuid"
import { REQUEST_TIMEOUT, Transport } from "epic-net"

import {
	IChildStore,
	ChildStoreSubscriptionStatus,
	IChildStoreSubscriptionManager,
	TChildStoreSubscriptionStatusListener
} from "./ChildStore"

import TWorkerProcessMessageHandler = ProcessClient.TMessageHandler
import {ActionMessage} from 'typedux'
import { ActionMessageFilter } from "epic-typedux/filter"
import { AppStoreServerEventNames } from "epic-global"


const
	log = getLogger(__filename),
	id = `${ProcessConfig.getTypeName()}-${process.pid}`



/**
 * Wrapper for observer
 */
interface ObserveWrapper {
	id:string,
	keyPath:string|string[]
	resolver:Promise.Resolver<Function>
	handler:TClientStateHandler
	remover?:Function
}

interface IChildStoreWrapper {
	id:string
	childStore:IChildStore
	resolver:Promise.Resolver<any>
	manager:IChildStoreSubscriptionManager
	setStatus(status:ChildStoreSubscriptionStatus,err?:Error)
}

const
	actionProxies = getHot(module,'actionProxies',{}),
	observers:{[id:string]:ObserveWrapper} = getHot(module,'observers',{}),
	stateRequests = getHot(module,'stateRequests',{})

let
	childStoreWrapper = getHot(module,'childStoreWrapper',{}) as IChildStoreWrapper,
	transport = getHot(module,'transport',null) as Transport

setDataOnHotDispose(module,() => ({
	actionProxies,
	observers,
	childStoreWrapper,
	stateRequests,
	transport
}))


/**
 * Homogenized sendMessage to work in all processes
 */
const sendMessage = (type:string, body:any = {}) => {
	return connect().then(() => {
		transport.emit(type,body)
	})
}


/**
 * Create a new action client
 * 
 * @param leaf
 * @param type
 */
function newActionClient(leaf,type) {
	return function(...args) {
		return sendMessage(AppStoreServerEventNames.ActionRequest,{
			leaf,
			type,
			args
		})
	}
}

/**
 * get an action client
 * 
 * @param leaf
 * @returns {any}
 */
export function getActionClient(leaf:string):any {
	return new Proxy({},{
		get(target,type) {
			const fullName = `${leaf}.${type}`
			
			return actionProxies[fullName] ||
				(actionProxies[fullName] = newActionClient(leaf,type))
		}
	})
}


export type TClientStateHandler = (newValue,oldValue) => any

/**
 * Push a message to the server,
 * if it passes the filter
 *
 * @param action
 */
export const sendStoreAction = ActionMessageFilter((action:ActionMessage<any>) => {
	assign(action,{
		fromChildId: id
	})
	sendMessage(AppStoreServerEventNames.ChildStoreAction,{id,action})
})

/**
 * Attach a child store to the store server
 * 
 * @param childStore
 * @returns {any}
 */
export function attachChildStore(childStore:IChildStore):Promise<IChildStoreSubscriptionManager> {
	
	let 
		status:ChildStoreSubscriptionStatus = ChildStoreSubscriptionStatus.Starting,
		listeners:TChildStoreSubscriptionStatusListener[] = [],
		{filter} = childStore, 
		manager = {
			detach() {
				log.debug(`Detaching child store`)
				sendMessage(AppStoreServerEventNames.ChildStoreDetach,{id})
				childStoreWrapper = null
			},
			
			onStatusChange(listener:TChildStoreSubscriptionStatusListener) {
				listeners.push(listener)
			},
			
			
			getStatus() {
				return status
			},
			
			// SEND ACTION MESSAGE TO PARENT
			sendAction: sendStoreAction
		} as IChildStoreSubscriptionManager,
		wrapper = childStoreWrapper =  {
			id,
			childStore,
			manager,
			resolver: Promise.defer(),
			setStatus(status:ChildStoreSubscriptionStatus,err:Error = null) {
				listeners.forEach(listener => {
					listener(status,err)
				})
			}
		},
		{resolver} = wrapper
	
	// SEND THE SUBSCRIBE REQUEST
	sendMessage(AppStoreServerEventNames.ChildStoreSubscribeRequest, {
		id, 
		filter 
	}).catch(err => resolver.reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to start child store`, wrapper, err)
			childStoreWrapper = null
			resolver.reject(err)
		})
}

/**
 * Observer a state value @ at given keypath
 * 
 * @param keyPath
 * @param handler
 * @returns {Promise<Function>}
 */
export function clientObserveState(
	keyPath:string|string[], 
	handler:TClientStateHandler
):Promise<Function> {
	
	const
		id = uuid.v4(),
		wrapper:ObserveWrapper = observers[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer(),
			handler
		},
		{ reject } = wrapper.resolver
	
	sendMessage(AppStoreServerEventNames.ObserveStateRequest, { id, keyPath }).catch(err => reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to set state observer`, wrapper, err)
			delete observers[ id ]
			reject(err)
		}) as Promise<Function>
	
}

/**
 * Retrieve a state value
 * 
 * @param keyPath
 */
export async function getStateValue(...keyPath:string[]):Promise<any> {
	
	const
		id = uuid.v4(),
		request = stateRequests[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer()
		},
		{ reject } = request.resolver
	
	try {
		await sendMessage(AppStoreServerEventNames.StateRequest, { id, keyPath })
	} catch (err) {
		reject(err)
	}
	
	return request
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to get state value`, err)
			reject(err)
		})
}






/**
 * Connect function - runs serially
 */
function connect():Promise<any> {
	
	if (!transport) {
		transport = Transport.getDefault({
			hostname: AppStoreServerName
		})
		
		log.info(`Connecting to store server`)
		
		return transport
			.connect()
			.then(() => {
				log.info(`Store server CONNECTED`)
				attachEvents(transport)
			})
			
			.catch(err => {
				log.error(`Failed to connect to store server`,err)
				transport = null
				
				throw err
			})
	}
	
	return transport
		.waitForConnection()
	
}


/**
 * Attach event handlers to app store transport
 *
 * @param transport
 */
function attachEvents(transport) {
	
	transport.on(AppStoreServerEventNames.ChildStoreSubscribeResponse,({id,initialState,err}) => {
		const 
			wrapper = childStoreWrapper
		
		if (err) {
			log.error(`Failed to subscribe for childStore`,id,err,wrapper)
			if (wrapper) {
				wrapper.setStatus(ChildStoreSubscriptionStatus.Failed,err)
				wrapper.resolver.reject(err)
				childStoreWrapper = null
			}
			return
		}
		
		wrapper.childStore.setState(initialState)
		wrapper.setStatus(ChildStoreSubscriptionStatus.Running,err)
		wrapper.resolver.resolve(wrapper.manager)
		
	})
	
	transport.on(AppStoreServerEventNames.ChildStoreActionReducer,({action}) => {
		
		// if (!childStoreWrapper)
		// 	return log.error(`Unknown child store ${id}`)
		//
		const
			{windowId} = action
		
		if (windowId === getWindowId()) {
			log.debug(`I sent this so no need to dispatch again`)
			return
		}
			
		
		require('./AppStore').getReduxStore().dispatch(action)
	})
	
	/**
	 * Handle observe state change
	 */
	transport.on(AppStoreServerEventNames.ObserveStateChange, ({ id, newValue, oldValue }) => {
		const observer = observers[ id ]
		if (!observer) {
			log.error(`Received a message for id ${id} - but no observer found`)
		}
		
		observer.handler(newValue, oldValue)
	})
	
	/**
	 * Handle observe responses
	 */
	transport.on(AppStoreServerEventNames.ObserveStateResponse, ({ id, err }) => {
		const
			observer = observers[ id ]
		
		if (!observer) {
			return log.error(`Got response for unknown observer ${id}`, id, err)
		}
		
		if (err) {
			return observer.resolver.reject(err)
		}
		
		observer.remover = () => {
			sendMessage(AppStoreServerEventNames.ObserveStateRemove, { id })
			delete observers[ id ]
		}
		
		observer.resolver.resolve(observer.remover)
		
	})
	
	
	transport.on('stateResponse', ({ id, value, err }) => {
		const
			request = stateRequests[ id ]
		
		if (!request) {
			return log.error(`Got response for unknown state request ${id}`, id,  value, err)
		}
		
		if (err) {
			return request.resolver.reject(err)
		}
		
		request.resolver.resolve(value)
	})
	
}
