
import path = require('path')
import * as uuid from "node-uuid"
import { DatabaseEvents } from "./DatabaseEvents"
import { IDatabaseResponse, IDatabaseRequest } from "./DatabaseRequestResponse"
import { Transport } from "epic-net"
import { VariableProxy, cloneObject, getHot, setDataOnHotDispose, acceptHot } from "epic-global"
import { DatabaseServerName, ProcessType } from "epic-global"

const
	TIMEOUT = 180000,
	DatabaseServerType = ProcessType.DatabaseServer
	

const log = getLogger(__filename)
	
/**
 * Database entry template
 *
 * @type {string}
 */
//const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-db-entry.html')



/**
 * A database error occurred
 */
export class DatabaseError extends Error {

	constructor(
		public code,
		public description,
		public url
	) {
		super(description)
	}
}

/**
 * Pending database request - internal
 */
interface IDatabasePendingRequest {
	id:string
	request:IDatabaseRequest
	deferred:Promise.Resolver<any>
}

/**
 * Create a singleton instance
 *
 * @type {DatabaseClient}
 */
let databaseClient:DatabaseClient = null


/**
 * Perm proxy to database client
 *
 * @type {VariableProxy<DatabaseClient>}
 */
let databaseClientProxy:VariableProxy<DatabaseClient> = getHot(module,'databaseClientProxy',null)

/**
 * DatabaseWindow wraps the background
 * renderer process that is used to manage
 * database requests
 *
 */

export class DatabaseClient {
	
	/**
	 * Get Singleton
	 *
	 * @returns {DatabaseClient}
	 */
	static getInstance():DatabaseClient {
		assert(!ProcessConfig.isType(ProcessType.DatabaseServer),'DatabaseClient can NOT be started on the DatabaseServer')
			
		if (!databaseClient)
			databaseClient = new DatabaseClient()
		
		if (!databaseClientProxy)
			databaseClientProxy = new VariableProxy(DatabaseClient as any,databaseClient)
		else
			databaseClientProxy.setTargets(DatabaseClient,databaseClient)
		
		return databaseClientProxy.handler
	}
	
	/**
	 * Pending Request Map
	 *
	 * @type {{}}
	 */
	// private pendingRequests = new WeakMap<string,IDatabasePendingRequest>()
	private pendingRequests:{[id:string]:IDatabasePendingRequest} = {}
	
	/**
	 * Underlying transport - probably IPC
	 */
	public transport: Transport
	
	
	/**
	 * Check if running on database server
	 *
	 * @returns {boolean}
	 */
	get notRunningOnDatabaseServer() {
		return !ProcessConfig.isType(DatabaseServerType)
	}
	
	
	private constructor() {
		this.transport = Transport.getDefault({hostname: DatabaseServerName})
	}
	
	/**
	 * Connect to the database server
	 */
	async connect() {
		// Connect the transport if not the DB server
		if (this.notRunningOnDatabaseServer) {
			await this.transport.connect()
			
			this.transport.on(DatabaseEvents.Response,this.onResponse)
		}
	}
	
	async disconnect() {
		
	}
	
	/**
	 * Check if the IPC client is connected
	 *
	 * @throws if not connected
	 */
	private checkConnected() {
		assert(this.transport.connected,`Database Client is not connected`)
	}
	
	/**
	 * Remove all IPC listeners
	 */
	private removeListeners() {
		this.transport.removeListener(DatabaseEvents.Response,this.onResponse)
	}
	
	
	
	/**
	 * On request finished
	 *
	 * @param request
	 * @returns {()=>void}
	 */
	private onRequestFinished(request:IDatabaseRequest):() => void {
		return () => {
			delete this.pendingRequests[request.id]
			//this.pendingRequests.delete(request.id)
		}
	}

	/**
	 * onResponse received from window,
	 * map it back to request and resolve
	 *
	 * @param resp
	 */
	private onResponse = (resp:IDatabaseResponse) => {
		log.debug('Response Received',resp.requestId)

		const
			pendingRequest = this.pendingRequests[resp.requestId]
		
		//const pendingRequest = this.pendingRequests.get(resp.requestId)
		if (!pendingRequest) {
			log.error(`Response received, but no request found with provided id: ${resp.requestId}`,resp.error)
			return
		}

		if (resp.error)
			pendingRequest.deferred.reject(_.isError(resp.error) ? resp.error : new Error(resp.error as any))
		else
			pendingRequest.deferred.resolve(cloneObject(resp.result))

	}


	/**
	 * onTimeout Handler
	 *
	 * @param request
	 * @param deferred
	 * @returns {Promise.Resolver<any>}
	 */
	private onTimeout(request:IDatabaseRequest,deferred:Promise.Resolver<any>) {
		return (err:Promise.TimeoutError) => {
			log.error(`Database request timed out (${request.id})`,err)
			deferred.reject(new DatabaseError('TIMEOUT',err.toString(),''))
		}
	}


	/**
	 * Direct database request
	 *
	 * @param fn
	 * @param args
	 */
	request(fn:string,args:any[])
	/**
	 * Request data from a store (ie user = UserStore, etc)
	 * NOTE: Mapped props on Stores class
	 * @param store
	 * @param fn
	 * @param args
	 */
	request(store:string,fn:string,args:any[])
	request(storeOrFn:string,fnOrArgs:string|any[],finalArgs:any[] = null) {
		
		
		const
			deferred = Promise.defer(),
			[store,fn,args] = ((_.isString(fnOrArgs)) ?
				[storeOrFn,fnOrArgs,finalArgs] :
				[null,storeOrFn,fnOrArgs]),
				
			request = {
				id: `${store || 'db'}-${fn}-${uuid.v1()}`,
				store,
				fn,
				args
			}
		
		this.transport.waitForConnection()
			.then(() => {
				this.checkConnected()
				
				assert(fn && args,'Both args and fn MUST be defined')
				
				// Map the pending request
				this.pendingRequests[request.id] = {
					id:request.id,
					request,
					deferred
				}
				
				// Send the request
				this.transport.emit(DatabaseEvents.Request,request)
				
			})

		// Configure the promise timeout
		deferred.promise
			
			.timeout(TIMEOUT)

			// Catch and remap timeout error
			.catch(Promise.TimeoutError,this.onTimeout(request,deferred))

			// Finally clean up the request
			.finally(this.onRequestFinished(request))

		
		// Return the promise
		return deferred.promise
	}


	

	/**
	 * Stop the database
	 *
	 * @returns {any}
	 */
	kill():Promise<any> {
		// if (isHot) {
		// 	this.unbindEvents()
		// 	return Promise.resolve(true)
		// }

		// if (this.internalStatus > DatabaseStatus.Started || !this.window)
		// 	return Promise.resolve(true)
		//
		//
		// const promise = (this.stopDeferred = Promise.defer()).promise
		// promise.timeout(5000).catch((err) => {
		// 	log.error(`Failed to stop`,err)
		// })
		//
		// this.window.close()
		this.transport.disconnect()
		//this.removeListeners()
		return Promise.resolve(true)

	}

}


/**
 * Helper to get singleton
 * @returns {DatabaseClient}
 */
export function getDatabaseClient():DatabaseClient {
	return DatabaseClient.getInstance()
}

// Set container provider
Container.bind(DatabaseClient).provider({get: getDatabaseClient})

/**
 * Export the singleton by default
 */
export default new Proxy({}, {
	get: (target,prop) => getDatabaseClient()[prop]
}) as DatabaseClient


setDataOnHotDispose(module,() => ({
	databaseClientProxy
}))

acceptHot(module,log)