import {EventEmitter} from "events"

import {getStoreState} from "shared/store"
import {transformValues} from "shared/util"
import {IStateServerResponse} from "shared/actions/ServerClient"
import storeBuilder from 'shared/store/AppStoreBuilder'
import Worker from 'shared/Worker'
import * as path from 'path'

// Augment global with database server worker
// Allows for HMR
declare global {
	
	//noinspection JSUnusedLocalSymbols
	var databaseServerWorker:Worker
}



const
	log = getLogger(__filename),
	workerPath = path.resolve(process.cwd(),'dist/DatabaseServerEntry.js'),
	actionEmitter = new EventEmitter(),
	ipc = require('node-ipc')

// Create worker if it does not exist or it isnt running
if (!databaseServerWorker || !databaseServerWorker.running) {
	assignGlobal({
		databaseServerWorker: new Worker(workerPath)
	})
}


ipc.config.id = 'StateServer'
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

/**
 * Start the server and register handlers, etc
 */
export async function start() {
	log.info('Starting Server')
	
	// Database Server first
	if (databaseServerWorker.running) {
		log.info(`Database Server is already running - HMR?`)
	} else {
		log.info('Start the Database Server first')
		await databaseServerWorker.start()
	}
	
	// First create the store
	await storeBuilder(require('./ServerStoreEnhancer').default)
	
	// Configure IPC Server
	ipc.serve(() => {
		ipc.server.on('request',(request,socket) => {
			const
				{id, clientId,type} = request,
				handler = handlers[type]
			
			log.info(`Request received from ${clientId}`)
			
			if (!handler)
				return emitResponse(id,type,socket,null,new Error(`Unknown request type: ${request.type}`))
			
			
			try {
				const result = handler(request)
				
				emitResponse(id,type,socket,result)
				
			} catch (err) {
				emitResponse(id,type,socket,null,err)
			}
		})
		
		ipc.server.on('action',({clientId,leaf,name,args},socket) => {
			actionEmitter.emit('action',clientId,leaf,name,args)
		})
	})
	
	//Start IPC Server
	ipc.server.start()
	
	// Notify the main process that we are ready
	WorkerClient.ready()
	
}

/**
 * Stop the Server
 */
export function stop() {
	log.info('Stopping Server')
	ipc.server.stop()
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




// Immediately start
start()

/**
 * In HMR add dispose handler to stop current server
 */
if (module.hot) {
	module.hot.dispose(() => stop())
}

