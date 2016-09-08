
import {Repo as TSRepo, IModel} from 'typestore'
import ProcessType from "shared/ProcessType"
import {Stores} from 'shared/Stores'
import {ServiceStatus, BaseService, RegisterService, IServiceConstructor} from 'shared/services'
import {loadModelClasses,chunkSave,chunkRemove as chunkRemoveUtil} from 'shared/db/DatabaseUtil'
import {getDatabaseClient} from "shared/db/DatabaseClient"
import AppStoreService from "shared/services/AppStoreService"

const log = getLogger(__filename)


// Global ref to database services
let databaseService:DatabaseClientService = null


export type TDatabaseProxyFunction = (...args:any[]) => Promise<any>

/**
 * Database Client proxy
 */


class DatabaseProxy {

	private fnMap = {}
	private store:string

	constructor(private repoClazz = null) {
		this.store = (!repoClazz) ? null :
			(repoClazz.name || _.get(repoClazz,'prototype.constructor.name'))
	}

	/**
	 * Get proxy Function
	 *
	 * @param target
	 * @param name
	 * @returns {TDatabaseProxyFunction}
	 */
	get(target,name):TDatabaseProxyFunction {
		
		log.debug(`Getting proxy for ${name}`)
		
		return this.fnMap[name] || (
			this.fnMap[name] = (...args) => {
				log.debug(`Proxy request for ${name}`)

				return getDatabaseClient().request(this.store,name,args)
			}
		)
		
	}

}



/**
 * References to coordinator and plugins
 */
@RegisterService(
	ProcessType.StateServer,
	ProcessType.JobServer,
	ProcessType.JobWorker,
	ProcessType.Main,
	ProcessType.UI
)
export class DatabaseClientService extends BaseService {

	private _stores:Stores
	
	
	
	/**
	 * All global repositories
	 */

	get stores() {
		return this._stores
	}

	constructor() {
		super()
		
		databaseService = this
		
		this._stores = assign(new Stores(),{databaseService})
	}
	
	
	dependencies(): IServiceConstructor[] {
		return [AppStoreService]
	}
	
	/**
	 * Start the service
	 *
	 * @returns {DatabaseClientService}
	 */
	async start():Promise<this> {
		// assert(this.status() < ServiceStatus.Started,'Service is already started')
		
		log.info('Connecting to db first')
		const client = getDatabaseClient()
		await client.connect()
		
		
		// Load all model classes
		log.info('Loading models and creating store')
		loadModelClasses()


		// Load all
		const {RepoStore,IssueStore,AvailableRepoStore,CommentStore,
			LabelStore,ActivityStore,MilestoneStore,UserStore} = require('shared/models')

		assign(this._stores, {
			repo:          this.getStore(RepoStore),
			issue:         this.getStore(IssueStore),
			availableRepo: this.getStore(AvailableRepoStore),
			milestone:     this.getStore(MilestoneStore),
			comment:       this.getStore(CommentStore),
			label:         this.getStore(LabelStore),
			activity:      this.getStore(ActivityStore),
			user:          this.getStore(UserStore)
		})

		log.info('Repos Loaded')


		// In DEBUG mode expose repos on global
		if (Env.isDev) {
			assignGlobal({Repos:this._stores})
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


	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}Í
	 */Í

	getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
		return new Proxy({},new DatabaseProxy(repoClazz)) as any
	}
}




/**
 * Chunk remove utility
 *
 * @param modelIds
 * @returns {Promise<undefined>}
 */
export async function chunkRemove(modelIds) {
	return chunkRemoveUtil(databaseService,modelIds)
}

// Re-export stores & utils
export {
	Stores,
	chunkSave
}


export default DatabaseClientService

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}