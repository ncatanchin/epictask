import "epic-entry-shared/AppEntry"

import { loadProcessClientEntry } from "epic-entry-shared"
import { Coordinator as TSCoordinator, Repo as TSRepo, IModel, FinderRequest } from "typestore"

const
	{ProcessClientEntry} = loadProcessClientEntry()

import { Stores, IDatabaseRequest, DatabaseEvents } from "epic-database-client"

import {
	tempFilename, getUserDataFilename, acceptHot, addHotDisposeHandler, getHot,
	setDataOnHotDispose, getValue,uuid
} from "epic-global"
import { ProcessType } from "epic-entry-shared/ProcessType"


import { IPCServer } from "epic-net/IPCServer"

import { isPromise, isFunction } from "typeguard"
import { benchmark } from "epic-global/Benchmark"
import { DatabaseAdapter } from "epic-database-adapters/DatabaseAdapter"
import { EventType } from "epic-global/Constants"

// Logger
const
	log = getLogger(__filename)


assignGlobal({
	__webpack_require__
})

// DEBUG LOGGING
//log.setOverrideLevel(LogLevel.DEBUG)


let
	startDeferred:Promise.Resolver<any> = getHot(module, 'startDeferred', null),
	ipcServer = getHot(module,'ipcServer',null) as IPCServer,
	dbAdapter = getHot(module,'dbAdapter',null) as DatabaseAdapter
	


// Database name and path

setDataOnHotDispose(module, () => ({
	startDeferred,
	ipcServer,
	dbAdapter
}))

const RequestHandlers = {
	[DatabaseEvents.Request]: async (
		server:IPCServer,
		socket,
		type:string,
		request
	) => {
		await executeRequest(server,socket, request)
	}
}




/**
 * Database entry
 */
export class DatabaseServerEntry extends ProcessClientEntry {
	
	constructor() {
		super(ProcessType.DatabaseServer)
		
		
	}
	
	
	
	/**
	 * Services are disabled on the database server
	 *
	 * @returns {boolean}
	 */
	servicesEnabled() {
		return false
	}
	
	/**
	 * Start the database server
	 *
	 * @returns {Promise<any>}
	 */
	protected async start() {
		
		// ONLY START ONCE
		if (startDeferred)
			return startDeferred.promise
		
		// CREATE DEFERRED PROMISE
		startDeferred = Promise.defer()
		try {
			log.info('Starting Database Server')
			
			dbAdapter = DatabaseAdapter.get()
			
			await dbAdapter.start()
			
			await require("./schema/DatabaseSchemaBuilder").default(dbAdapter)
			
			// IF USING REMOTE DB THEN SETUP IPC
			if (Env.Config.RemoteDatabase) {
					
					// Configure IPC Server
					if (!ipcServer) {
						log.info('Starting IPC Server')
						ipcServer = new IPCServer(DatabaseServerName, RequestHandlers, true)
						
						log.info(`Pending ipc server start`)
						await ipcServer.start().timeout(10000, "IPC server took too long")
						log.info(`IPC Server is ready`)
					}
				
					
				
				
			}
			EventHub.broadcast(EventType.DatabaseReady)
			startDeferred.resolve()
			
		} catch (err) {
			log.error(`Failed to start db server`,err)
			EventHub.broadcast(EventType.DatabaseReady,_.pick(err,'message','code','stack'))
			startDeferred.reject(err)
			throw err
		}
		
		log.info(`Database server started`)
		return startDeferred.promise
	}
	
	
	
	/**
	 * Stop the database server
	 */
	protected async stop():Promise<any> {
		// Stop ipc server
		await ipcServer.stop()
		
		await dbAdapter.stop()
		
	}
}

/**
 * Send response to request
 *
 * @param toServer
 * @param socket
 * @param request
 * @param result
 * @param error
 */
function respond(toServer:IPCServer,socket, request:IDatabaseRequest, result, error:Error = null) {
	const response = {
		requestId: request.id,
		result,
		error
	}
	
	log.debug('Sending response', response)
	toServer.send(socket, DatabaseEvents.Response, response)
	//ipcRenderer.send(DatabaseEvents.Response,{requestId:request.id,result,error})
}

/**
 * Execute a request
 *
 * @param fromServer
 * @param socket
 * @param request
 */
async function executeRequest(fromServer:IPCServer,socket, request:IDatabaseRequest) {
	try {
		
		const
			{ id:requestId, store:storeName, fn:fnName, args } = request,
		
			{result} = await benchmark(`Server query ${storeName}.${fnName}`,() => dbAdapter.execute(request))()
		
		respond(fromServer,socket,request,result)
	} catch (err) {
		log.error('Request failed', err, request)
		respond(fromServer,socket, request, null, err)
	}
}


// Singleton
const databaseServerEntry = new DatabaseServerEntry()


/**
 * Export the singleton
 */
export default databaseServerEntry


/**
 * HMR - accept self - on dispose, close DB
 */

addHotDisposeHandler(module, () => {
	log.info('disposing database server')
	databaseServerEntry.kill()
	
})

acceptHot(module, log)