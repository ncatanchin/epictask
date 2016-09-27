import { getStore, getStoreState } from "shared/store/AppStore"
import { IPCServer } from "shared/net/IPCServer"
import { getHot, setDataOnHotDispose,acceptHot } from "shared/util/HotUtils"
import { ActionFactoryProviders } from  "shared/actions/ActionFactoryProvider"
import {
	getAllActions
} from 'typedux'
import { AppStoreServerName } from "shared/Constants"

const
	log = getLogger(__filename),
	clientObservers = getHot(module, 'clientObservers', {})

let
	ipcServer:IPCServer = getHot(module, 'ipcServer', null) as IPCServer


/**
 * All message handlers
 */
const clientMessageHandlers = {
	
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
		stateRequest(server:IPCServer, socket, event:string, { id, keyPath }) {
		const
			state = getStoreState(),
			rawValue = getStateValue(...keyPath),
			value = _.toJS(rawValue)
		
		log.info(`Getting state value`, id, keyPath, rawValue, value)
		
		server.send(socket, 'stateResponse', {
			id,
			value
		})
	},
	
	/**
	 * Handle observer request
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 * @param keyPath
	 */
		observeStateRequest(server:IPCServer, socket, event:string, { id, keyPath }) {
		
		let
			lastValue = null
		
		const
			handler = (newValue, oldValue) => {
				if (lastValue) {
					oldValue = lastValue
				}
				
				lastValue = newValue = _.toJS(newValue)
				server.send(socket, 'observeStateChange', { id, newValue, oldValue })
			}
		
		try {
			clientObservers[ id ] = {
				id,
				socket,
				keyPath,
				remover: getStore().observe(keyPath, handler)
			}
			
			server.send(socket, 'observeStateResponse', { id })
		} catch (err) {
			log.error(`Unable to create observer`, err)
			server.send(socket, 'observeStateResponse', { id, err })
		}
	},
	
	/**
	 * Stop watching state changes
	 *
	 * @param server
	 * @param socket
	 * @param event
	 * @param id
	 */
		
		observeStateRemove(server:IPCServer, socket, event:string, { id }) {
		const observer = clientObservers[ id ]
		
		if (!observer)
			return log.warn(`Unable to find observer with id ${id}, can not remove`)
		
		observer.remover()
		delete clientObservers[ id ]
	},
	
	
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
		actionRequest(server:IPCServer, socket, event:string, { type, leaf, args }) {
		log.info(`Received action request: `, leaf, type, args)
		
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


function getStateValue(...keyPath) {
	let val = getStoreState()
	
	for (let key of keyPath) {
		if (!val)
			break
		
		let nextVal = _.isFunction(val.get) && val.get(key)
		if (!nextVal)
			nextVal = val[ key ]
		
		val = nextVal
	}
	
	return val
}


interface IMessageSender {
	sendMessage(type:string, body)
}

/**
 * Start the state server
 *
 * @returns {any|{fontWeight}|void|{color}}
 */
export async function start() {
	
	if (ProcessConfig.isStorybook()) {
		log.warn(`AppStore server does not run in storybook`)
		return
	}
	
	if (ipcServer) {
		log.warn(`IPC server already warning - maybe HMR`)
		return stopStoreServer
	}
	
	try {
		ipcServer = new IPCServer(AppStoreServerName,clientMessageHandlers)
		
		log.info(`Starting store server`)
		
		await ipcServer.start()
		
		log.info(`Server started`)
	} catch (err) {
		log.error(`Failed to start app store server, process type is ${ProcessConfig.getTypeName()}`, err)
		
		stopStoreServer()
	}
	
	
	return stopStoreServer
}

setDataOnHotDispose(module, () => ({
	clientObservers,
	ipcServer
}))
acceptHot(module,log)