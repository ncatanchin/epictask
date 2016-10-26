
import { acceptHot } from "epic-global/HotUtils"
import {canProxyProperty} from 'epic-global/ProxyUtil'
import { Stores, getDatabaseClient, chunkRemove, chunkSave } from "epic-database-client"
import { BaseService } from "./internal/BaseService"
import { IServiceConstructor} from './internal/Types'
import {RegisterService} from './internal/ServiceDecorations'

const
	log = getLogger(__filename)


// Global ref to database services
let
	databaseService:DatabaseClientService = null


/**
 * Database proxy function shape
 */
export type TDatabaseProxyFunction = (...args:any[]) => Promise<any>

/**
 * Database Client proxy - maps to a single store or no store
 */

class DatabaseProxy {

	private fnMap = {}
	
	constructor(private store:string = null) {
		
	}

	/**
	 * Get proxy Function
	 *
	 * @param target
	 * @param name
	 * @returns {TDatabaseProxyFunction}
	 */
	get(target,name):TDatabaseProxyFunction {
		if (canProxyProperty(name))
			return null
		
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
	ProcessType.JobServer,
	ProcessType.JobWorker,
	ProcessType.Main,
	ProcessType.UI,
	ProcessType.UIChildWindow
)
export class DatabaseClientService extends BaseService {

	private _stores:Stores
	
	
	dbProxy
	
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
		
		this._stores = assign(new Stores(),{databaseService})
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
		
		client.connect().then(() => log.info('Connected'))
		
		// Load all model classes
		log.info('Loading models and creating store')
		//loadModelClasses()

		assign(this._stores, {
			repo:          this.getStore('RepoStore'),
			issue:         this.getStore('IssueStore'),
			availableRepo: this.getStore('AvailableRepoStore'),
			milestone:     this.getStore('MilestoneStore'),
			comment:       this.getStore('CommentStore'),
			label:         this.getStore('LabelStore'),
			user:          this.getStore('UserStore'),
			issuesEvent:  this.getStore('IssuesEventStore'),
			repoEvent: this.getStore('RepoEventStore')
		})

		log.debug('Repos Loaded')
		
		// Direct proxy
		this.dbProxy = new Proxy({},new DatabaseProxy())
		
		// In DEBUG mode expose repos on global
		if (Env.isDev) {
			assignGlobal({
				Repos:this._stores
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


	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}Í
	 */Í

	private getStore(repoName:string) {
		return new Proxy({},new DatabaseProxy(repoName)) as any
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
