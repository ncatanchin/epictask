
import { acceptHot } from "epic-global/HotUtils"

import { Stores, getDatabaseClient, chunkRemove, chunkSave } from "epic-database-client"
import { BaseService } from "./internal/BaseService"

import {RegisterService} from './internal/ServiceDecorations'

const
	log = getLogger(__filename)


// Global ref to database services
let
	databaseService:DatabaseClientService = null


/**
 * References to coordinator and plugins
 */
@RegisterService(
	ProcessType.JobServer,
	ProcessType.JobWorker,
	ProcessType.Main,
	ProcessType.UI
)
export class DatabaseClientService extends BaseService {

	private _stores:Stores
	
	static readonly ServiceName = "DatabaseClientService"
	
	/**
	 * All global repositories
	 */

	get stores() {
		return this._stores
	}
	
	/**
	 * Creates a new client service
	 */
	constructor() {
		super()
		
		databaseService = this
		
	}
	
	
	dependencies(): IServiceConstructor[] {
		return []
	}
	
	/**
	 * Start the service
	 *
	 * @returns {DatabaseClientService}
	 */
	async start():Promise<this> {
		// assert(this.status() < ServiceStatus.Started,'Service is already started')
		
		log.info('Connecting to db first')
		const
			client = getDatabaseClient()
		
		await client.ready()
		
		this._stores = client.getStores()
		
		// In DEBUG mode expose repos on global
		if (Env.isDev) {
			assignGlobal({
				Stores:this._stores
			})
		}

		// Now bind repos to the IOC
		Container.bind(Stores).provider({
			get: () => this.stores
		})

		return super.start()
	}


	/**
	 * Stop the database service,
	 * internally it stops the db window too
	 *
	 * @returns {DatabaseClientService}
	 */
	async stop(isHot = false):Promise<this> {
		return super.stop()
	}

	destroy(isHot = false):this {
		super.destroy()
		return this
	}


}





// Re-export stores & utils
export {
	Stores,
	chunkSave,
	chunkRemove
}


export default DatabaseClientService

acceptHot(module)
