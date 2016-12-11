
import { Repo as TSRepo} from "typestore"

import { Stores } from "epic-database-client/Stores"



let
	instance:DatabaseAdapter


/**
 * Base for all database adapters
 */
export abstract class DatabaseAdapter {
	
	
	
	direct(store:TSRepo<any>,name:string,...args) {
		return Promise.resolve()
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


