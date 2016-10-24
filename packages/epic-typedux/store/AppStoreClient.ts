
import {ChildClient} from 'epic-common'
import * as uuid from 'node-uuid'
import {AppStoreServerName} from 'epic-global'
import {REQUEST_TIMEOUT} from 'epic-net'
import { getHot, setDataOnHotDispose } from  "epic-common"
import {BrowserWindow,ipcMain} from 'electron'
import { Transport } from "epic-net"

import TWorkerProcessMessageHandler = ChildClient.TWorkerProcessMessageHandler

import {
	IChildStore, ChildStoreSubscriptionStatus, IChildStoreSubscriptionManager, TChildStoreSubscriptionStatusListener
} from "./ChildStore"





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
	log = getLogger(__filename),
	actionProxies = getHot(module,'actionProxies',{}),
	childStoreWrappers = getHot(module,'childStoreWrappers',{}) as {[id:string]:IChildStoreWrapper},
	observers:{[id:string]:ObserveWrapper} = getHot(module,'observers',{}),
	stateRequests = getHot(module,'stateRequests',{})

let
	transport = getHot(module,'transport',null) as Transport

setDataOnHotDispose(module,() => ({
	actionProxies,
	observers,
	childStoreWrappers,
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
		return sendMessage('actionRequest',{
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
 * Attach a child store to the store server
 * 
 * @param childStore
 * @returns {any}
 */
export function attachChildStore(childStore:IChildStore):Promise<IChildStoreSubscriptionManager> {
	
	let 
		status:ChildStoreSubscriptionStatus = ChildStoreSubscriptionStatus.Starting,
		id = uuid.v4(),
		listeners:TChildStoreSubscriptionStatusListener[] = [],
		{filter} = childStore, 
		manager = {
			detach() {
				log.debug(`Detaching child store`)
				sendMessage('childStoreDetach',{id})
				delete childStoreWrappers[id]
			},
			
			onStatusChange(listener:TChildStoreSubscriptionStatusListener) {
				listeners.push(listener)
			},
			
			
			getStatus() {
				return status
			},
			
			// SEND ACTION MESSAGE TO PARENT
			sendAction(action) {
				action.fromChildId = id
				sendMessage('childStoreAction',{id,action})
			}
		} as IChildStoreSubscriptionManager,
		wrapper = childStoreWrappers[id] =  {
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
	sendMessage('childStoreSubscribeRequest', {
		id, 
		filter 
	}).catch(err => resolver.reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to start child store`, wrapper, err)
			delete childStoreWrappers[ id ]
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
	
	sendMessage('observeStateRequest', { id, keyPath }).catch(err => reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to set state observer`, wrapper, err)
			delete observers[ id ]
			reject(err)
		})
	
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
		await sendMessage('stateRequest', { id, keyPath })
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
	
	transport.on('childStoreSubscribeResponse',({id,initialState,err}) => {
		const 
			wrapper:IChildStoreWrapper = childStoreWrappers[id]
		
		if (err) {
			log.error(`Failed to subscribe for childStore`,id,err,wrapper)
			if (wrapper) {
				wrapper.setStatus(ChildStoreSubscriptionStatus.Failed,err)
				wrapper.resolver.reject(err)
				delete childStoreWrappers[id]
			}
			return
		}
		
		wrapper.childStore.setState(initialState)
		wrapper.setStatus(ChildStoreSubscriptionStatus.Running,err)
		wrapper.resolver.resolve(wrapper.manager)
		
	})
	
	transport.on('childStoreActionReducer',({id,action}) => {
		const
			wrapper:IChildStoreWrapper = childStoreWrappers[id]
		
		if (!wrapper)
			return log.error(`Unknown child store ${id}`)
		
		//process.nextTick(() =>
		require('./AppStore').getReduxStore().dispatch(action)
			//wrapper.childStore.dispatch(action))
		
	})
	
	/**
	 * Handle observe state change
	 */
	transport.on('observeStateChange', ({ id, newValue, oldValue }) => {
		const observer = observers[ id ]
		if (!observer) {
			log.error(`Received a message for id ${id} - but no observer found`)
		}
		
		observer.handler(newValue, oldValue)
	})
	
	/**
	 * Handle observe responses
	 */
	transport.on('observeStateResponse', ({ id, err }) => {
		const
			observer = observers[ id ]
		
		if (!observer) {
			return log.error(`Got response for unknown observer ${id}`, id, err)
		}
		
		if (err) {
			return observer.resolver.reject(err)
		}
		
		observer.remover = () => {
			sendMessage("observeStateRemove", { id })
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
