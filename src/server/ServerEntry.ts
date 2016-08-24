import WorkerEntry from 'shared/WorkerEntry'

import {EventEmitter} from "events"

import {getStoreState} from "shared/store"
import {transformValues} from "shared/util"
import {IStateServerResponse} from "shared/server/ServerClient"
import storeBuilder from 'shared/store/AppStoreBuilder'
import {ProcessNames} from "shared/ProcessType"

const
	log = getLogger(__filename),
	actionEmitter = new EventEmitter(),
	ipc = require('node-ipc')
	

let startDeferred:Promise.Resolver<any> = null

ipc.config.id = ProcessNames.Server
ipc.config.retry = 1500

/**
 * IPC message handlers
 *
 * @type {any}
 */
const handlers = {
	getState() {
		log.info('Getting state for renderer')
		
		const
			mainState = getStoreState(),
			mainStateJS = mainState.toJS()
		
		return transformValues(
			mainStateJS,
			(key, val) => (val.toJS) ? val.toJS() : val
		)
	}
}


/**
 * Sent a request response
 *
 * @param id of the request
 * @param type of the request
 * @param socket the originating socket
 * @param result the result - null if error
 * @param error if error occurred then error
 */
function emitResponse(id,type,socket,result,error = null) {
	ipc.server.emit(socket, 'response', {
		id,
		type,
		result,
		error
	} as IStateServerResponse)
}


/**
 *
 * @param action
 */
export async function broadcastAction(action) {
	ipc.server.broadcast('action',action)
}

export class ServerEntry extends WorkerEntry {
	
	constructor() {
		super(ProcessType.Server)
	}
	
	/**
	 * Start the server and register handlers, etc
	 */
	protected async start() {
		if (startDeferred)
			return startDeferred.promise
		
		startDeferred = Promise.defer()
		log.info('Starting Server')
		
		// First create the store
		await storeBuilder(require('./ServerStoreEnhancer').default)
		
		// Configure IPC Server
		ipc.serve(() => {
			ipc.server.on('request', (request, socket) => {
				const
					{id, clientId, type} = request,
					handler = handlers[type]
				
				log.info(`Request received from ${clientId}`)
				
				if (!handler)
					return emitResponse(id, type, socket, null, new Error(`Unknown request type: ${request.type}`))
				
				
				try {
					const result = handler(request)
					
					emitResponse(id, type, socket, result)
					
				} catch (err) {
					emitResponse(id, type, socket, null, err)
				}
			})
			
			ipc.server.on('action', ({clientId, leaf, name, args}, socket) => {
				actionEmitter.emit('action', clientId, leaf, name, args)
			})
			
			log.info('Server Started')
			startDeferred.resolve()
		})
		
		//Start IPC Server
		ipc.server.start()
		
		await startDeferred.promise
	}
	
	/**
	 * Stop the Server
	 */
	protected async stop() {
		log.info('Stopping Server')
		if (ipc.server && ipc.server.stop)
			ipc.server.stop()
		
		ipc.disconnect()
		
	}
}


/**
 * Action listener signature
 */
export type TServerActionListener = (clientId:string,leaf:string,name:string,args:any[]) => void

/**
 * Add an action listener
 *
 * @param listener
 */
export function addActionListener(listener:TServerActionListener) {
	actionEmitter.addListener('action',listener)
}


/**
 * Remove action listener
 */
export function removeActionListener(listener:TServerActionListener) {
	actionEmitter.removeListener('action',listener)
}


// Create the server
const serverEntry = new ServerEntry()

// Start
export default serverEntry


/**
 * In HMR add dispose handler to stop current server
 */
if (module.hot) {
	module.hot.dispose((data:any) => {
		serverEntry.kill()
	})
	
	module.hot.accept()
}

