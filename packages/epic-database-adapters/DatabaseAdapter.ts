import { Repo as TSRepo, IModel as TSIModel, Coordinator as TSCoordinator} from "typestore"
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
	
	abstract isRunning():boolean
	
	/**
	 * get the stores
	 */
	abstract getStores():Stores
	
	/**
	 * Create store context
	 *
	 * @param modelConfigs
	 * @param name
	 */
	abstract createPluginDataContext(name:string,...modelConfigs:IPluginModelStoreConfig[]):Promise<IPluginStoreContext>
	
	/**
	 * Close the plugin data context
	 *
	 * @param context
	 */
	abstract closePluginDataContext(context:IPluginStoreContext):Promise<void>
	
	/**
	 * Execute a request
	 *
	 * @param request
	 */
	abstract async execute(request:IDatabaseRequest):Promise<IDatabaseResponse>
	
}


