import { getAllActions, getAction, ActionFactory } from "typedux"

import { IPCServer, TIPCEventHandler } from "epic-net"
import { getHot, setDataOnHotDispose, acceptHot, AppStoreServerName } from "epic-global"
import { ActionFactoryProviders } from "epic-typedux/provider"
import {shortId} from 'epic-util'
import { AppStoreServerEventNames } from "epic-global"
import {isFunction} from 'typeguard'
import { toPlainObject,fromPlainObject } from "typetransform"
import { cloneObjectShallow } from "epic-global/ObjectUtil"



const
	log = getLogger(__filename),
	{ nextTick } = process,
	clientObservers = getHot(module, 'clientObservers', {}),
	childStores = getHot(module, 'clientObservers', {}) as any

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)

let
	ipcServer:IPCServer = getHot(module, 'ipcServer', null) as IPCServer

/**
 * Push an action reducer to children
 *
 * @param action
 */
export function broadcastAppStoreAction(action) {
	ipcServer.broadcast(
		AppStoreServerEventNames.ChildStoreActionReducer, toPlainObject({
			action: cloneObjectShallow(action,{fromServer:true})
		}))
}

/**
 * All message handlers
 */
namespace clientMessageHandlers {
	
	
	/**
	 * Dispatch Action from child process
	 *
	 * @param action
	 */
	function childStoreDispatch(action) {
		action = fromPlainObject(action)
		const
			{ fromChildId, leaf, type, args } = action,
			store = getReduxStore(),
			actionReg = getAction(leaf, type)
		
		if (!actionReg)
			throw new Error(`Could not find action ${leaf}:${type} on main process`)
		
		log.debug(`Executing action on main: ${leaf}:${type}`)
		
		nextTick(() => {
			if (actionReg.options.isReducer) {
				
				const
					actions:ActionFactory<any,any> = Container.get(actionReg.actionFactory) as any,
					msg = actions.newMessage(shortId(), leaf, actionReg.type, [], args, {
						source: {
							isReducer: true,
							fromRenderer: true,
							fromChildId
						}
					})
				
				store.dispatch(msg)
				
				const
					actionCopy = cloneObjectShallow(action)
				
				nextTick(() => broadcastAppStoreAction(actionCopy))
			} else {
				actionReg
					.action(factory => Container.get(factory), ...args)
			}
		})
	}
	
	export function childStoreSubscribeRequest(server:IPCServer, socket, event:string, {
		id,
		filter
	}:{id:string,filter:any}) {
		log.debug(`Child subscribing with id ${id} and filter`, filter)
		childStores[ id ] = {
			id,
			filter,
			socket
		}
		const
			state = toPlainObject(getStoreState())
		
		
		server.send(socket, AppStoreServerEventNames.ChildStoreSubscribeResponse, { id, initialState: state })
	}
	
	
	/**
	 * Client store detach
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 */
	export function childStoreDetach(server:IPCServer, socket, event:string, { id }) {
		log.debug(`Detaching child store ${id}`)
		delete childStores[ id ]
	}
	
	/**
	 * Client store action
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 * @param action
	 */
	export function childStoreAction(server:IPCServer, socket, event:string, { id, action }) {
		
		log.debug(`Received action message`, action, 'from', id)
		childStoreDispatch(action)
	}
	
	/**
	 *
	 * Get a value from the store state
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 * @param keyPath
	 */
	export function stateRequest(server:IPCServer, socket, event:string, { id, keyPath }) {
		const
			state = getStoreState(),
			keys = (Array.isArray(keyPath) ? keyPath : [keyPath]),
			rawValue = getStateValue(...keys),
			value = toPlainObject(rawValue)
		
		log.debug(`Getting state value`, id, keyPath, rawValue, value)
		
		server.send(socket, AppStoreServerEventNames.StateResponse, {
			id,
			value
		})
	}
	
	/**
	 * Handle observer request
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 * @param keyPath
	 */
	export function observeStateRequest(server:IPCServer, socket, event:string, { id, keyPath }) {
		
		let
			lastValue = null
		
		const
			handler = (newValue, oldValue) => {
				if (lastValue) {
					oldValue = lastValue
				}
				
				lastValue = newValue = toPlainObject(newValue)
				server.send(socket, AppStoreServerEventNames.ObserveStateChange, { id, newValue, oldValue })
			}
		
		try {
			clientObservers[ id ] = {
				id,
				socket,
				keyPath,
				remover: getStore().observe(keyPath, handler)
			}
			
			server.send(socket, AppStoreServerEventNames.ObserveStateResponse, { id })
		} catch (err) {
			log.error(`Unable to create observer`, err)
			server.send(socket, AppStoreServerEventNames.ObserveStateResponse, { id, err })
		}
	}
	
	/**
	 * Stop watching state changes
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 */
	
	export function observeStateRemove(server:IPCServer, socket, event:string, { id }) {
		const observer = clientObservers[ id ]
		
		if (!observer)
			return log.warn(`Unable to find observer with id ${id}, can not remove`)
		
		observer.remover()
		delete clientObservers[ id ]
	}
	
	
	/**
	 * Action request from client server (db/job)
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param type
	 * @param leaf
	 * @param args
	 */
	export function actionRequest(server:IPCServer, socket, event:string, { type, leaf, args }) {
		log.debug(`Received action request: `, leaf, type, args)
		
		const
			actions = ActionFactoryProviders[ leaf ]
		
		if (!actions || !actions[ type ]) {
			const msg = `Unable to find action ${leaf}.${type} in ${Object.keys(getAllActions()).join(', ')}`
			log.warn(msg, getAllActions())
			throw new Error(msg)
		}
		
		actions[ type ].apply(actions, args)
		
	}
}

const
	HandledEventNames = [
		AppStoreServerEventNames.ActionRequest,
		AppStoreServerEventNames.ObserveStateRemove,
		AppStoreServerEventNames.ObserveStateRequest,
		AppStoreServerEventNames.StateRequest,
		AppStoreServerEventNames.ChildStoreSubscribeRequest,
		AppStoreServerEventNames.ChildStoreDetach,
		AppStoreServerEventNames.ChildStoreAction
	],
	messageHandlers = Object.keys(clientMessageHandlers)
		.reduce((handlerMap,key) => {
			const
				eventName =
					HandledEventNames.find(it => _.toLower(it) === _.toLower(key))
			
			if (eventName) {
				handlerMap[eventName] = clientMessageHandlers[key]
			}
			return handlerMap
		},{}) as {[event:string]:TIPCEventHandler}

assert(Object.keys(messageHandlers).length === HandledEventNames.length, `Request event handlers length doesn't equal the filtered handlers length`)

/**
 * Stop the ipc server
 */
function stopStoreServer() {
	if (!ipcServer) {
		log.error(`IPC server is null - not running - weird situation`)
		return
	}
	
	ipcServer.stop()
	ipcServer = null
}


/**
 * Get value from state
 *
 * @param keyPath
 * @returns {Map<string, any>}
 */
function getStateValue(...keyPath) {
	let val = getStoreState()
	
	for (let key of keyPath) {
		if (!val)
			break
		
		let nextVal =
			isFunction(val.get) ? val.get(key) : val[ key ]
		
		if (!nextVal)
			return null
		
		val = nextVal
	}
	
	return val
}



/**
 * Start the state server
 *
 * @returns {any|{fontWeight}|void|{color}}
 */
export async function start() {
	
	if (ipcServer) {
		log.warn(`IPC server already warning - maybe HMR`)
		return stopStoreServer
	}
	
	try {
		ipcServer = new IPCServer(AppStoreServerName, messageHandlers, true)
		
		log.info(`Starting IPC server`)
		
		await ipcServer.start().delay(500)
		
		
		log.info(`IPC Server started`)
	} catch (err) {
		log.error(`Failed to start app store server, process type is ${ProcessConfig.getTypeName()}`, err)
		
		stopStoreServer()
	}
	
	
	return stopStoreServer
}


/**
 * HMR
 */
setDataOnHotDispose(module, () => ({
	clientObservers,
	ipcServer
}))

acceptHot(module, log)