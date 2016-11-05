


import { Stores } from "epic-database-client/Stores"
import { IDatabaseRequest, IDatabaseResponse } from "epic-database-client/DatabaseRequestResponse"


let
	instance:DatabaseAdapter

/**
 * Load the load adapter
 *
 * @returns {any}
 */
function loadLocal() {
	const
		DatabaseLocalAdapter = require('./DatabaseLocalAdapter').DatabaseLocalAdapter
	
	return instance = new DatabaseLocalAdapter()
}

/**
 * Load remote adapter
 *
 * @returns {DatabaseRemoteAdapter}
 */
function loadRemote() {
	const
		DatabaseRemoteAdapter = require('./DatabaseRemoteAdapter').DatabaseRemoteAdapter
	
	return instance = new DatabaseRemoteAdapter()
}

/**
 * Base for all database adapters
 */
export abstract class DatabaseAdapter {
	
	static get() {
		return instance ||
			(!Env.Config.RemoteDatabase || ProcessConfig.isType(ProcessType.DatabaseServer) ?
				loadLocal() :
				loadRemote())
		
	}
	
	/**
	 * Start
	 */
	abstract async start()
	
	
	/**
	 * Stop
	 */
	abstract async stop()
	
	/**
	 * get the stores
	 */
	abstract getStores():Stores
	
	/**
	 * Execute a request
	 *
	 * @param request
	 */
	abstract async execute(request:IDatabaseRequest):Promise<IDatabaseResponse>
	
}