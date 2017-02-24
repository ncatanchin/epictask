import { Map, Record, List } from "immutable"
import * as TS from 'typestore'
import { getStores, getDatabaseConfig } from 'epic-database-client'
import { PouchDBPlugin } from "typestore-plugin-pouchdb"
import { getValue } from "typeguard"
/**
 * Created by jglanz on 2/5/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Shape of database stores
 */
export interface IPluginDatabaseStores extends IStores {
	[name:string]:TS.Repo<any>
}

/**
 * PluginDatabaseContext
 *
 * @class PluginDatabaseContext
 * @constructor
 **/
export class PluginDatabaseContext {
	
	private coordinator:TS.Coordinator
	private storePlugin:PouchDBPlugin
	
	private stores:IPluginDatabaseStores
	
	private models:Array<[IModelConstructor<any>,IModelStoreConstructor<any,any>]> = []
	
	constructor() {
		
	}
	
	/**
	 * Add a model to the registered models list for this plugin
	 *
	 * @param clazz
	 * @param storeClazz
	 */
	async registerModel
	<T extends TS.IModel,TC extends IModelConstructor<T>,TR extends TS.Repo<T>>
	(clazz:TC,storeClazz:IModelStoreConstructor<T,TR>):Promise<void> {
		assert(
			!this.models.find(([aClazz,aStoreClazz]) =>
				[aClazz,aStoreClazz].includes(clazz) || [aClazz,aStoreClazz].includes(storeClazz)),
			`Class or Store class is already registered: ${clazz.name}/${storeClazz.name}`
		)
		this.models.push([clazz,storeClazz])
	}
	
	
	/**
	 * Start the plugin database context
	 *
	 * @returns {Promise<void>}
	 */
	async start() {
		const
			storePlugin = this.storePlugin = new PouchDBPlugin(getDatabaseConfig()),
			coordinator = this.coordinator = new TS.Coordinator(),
			modelClazzes = this.models.map(([modelClazz]) => modelClazz),
			modelNames = modelClazzes.map(modelClazz =>
				getValue(() => modelClazz.$$clazz || modelClazz.name)),
			storeClazzes = this.models.map(([modelClazz,storeClazz]) => storeClazz)
		
		log.debug(`Initializing coordinator with models: ${modelNames.join(', ')}`)
		await coordinator.init({}, storePlugin)
		
		log.debug(`Starting coordinator with models: ${modelNames.join(', ')}`)
		await coordinator.start(...modelClazzes)
		
		this.stores = Object.assign(getStores(), this.models.reduce(([clazz,storeClazz]) => {
			
		},{} as any))
	}
	
	/**
	 * Stop the plugin database context
	 */
	getStores():IPluginDatabaseStores {
		return this.stores
	}
	
}

export default PluginDatabaseContext