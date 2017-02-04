import { Repo as TSRepo, IModel as TSIModel} from "typestore"
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
	 * Add a model store
	 *
	 * @param clazz
	 * @param storeClazz
	 */
	abstract addStore<T extends TSIModel,TC extends IModelConstructor<T>,TR extends TSRepo<T>>(clazz:TC,storeClazz:{new ():TR}):Promise<TR>
	
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


