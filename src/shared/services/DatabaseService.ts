

import {Repo as TSRepo, IModel} from 'typestore'
import {ServiceStatus, BaseService} from './IService'
import Electron = require('electron')
import {Stores} from 'shared/Stores'
import {loadModelClasses,chunkSave,chunkRemove as chunkRemoveUtil} from 'shared/util/DatabaseUtil'


// Global ref to database services
let databaseService:DatabaseClientService = null


/**
 * Start the database service
 */
export async function start() {
	if (databaseService) {
		log.info('Stopping DB first')
		await databaseService.stop()
		databaseService.destroy()
		databaseService = null
	}
	
	Container.bind(DatabaseClientService).provider({get: () => databaseService})
	
	// Load the database first
	log.info('Starting Database')
	
	databaseService = new DatabaseClientService()
	
	await databaseService.init()
	await databaseService.start()
	log.info('Database started')
}

const log = getLogger(__filename)


export type TDatabaseProxyFunction = (...args:any[]) => Promise<any>

/**
 * Database Client proxy
 */
class DatabaseProxy {

	private fnMap = {}
	private store:string

	constructor(private databaseService,private repoClazz = null) {
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

				// TODO: Use new client
				const dbWindow = getDatabaseServerWindow()
				return dbWindow.request(this.store,name,args)
			}
		)
		
	}

}



/**
 * References to coordinator and plugins
 */

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
		
		this._stores = assign(new Stores(),{
			databaseService:this
		})
	}


	/**
	 * Start the service
	 *
	 * @returns {DatabaseClientService}
	 */
	async start():Promise<this> {
		assert(this.status() < ServiceStatus.Started,'Service is already started')

		await super.start()

		// Load all model classes
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

		return this
	}


	/**
	 * Stop the database service,
	 * internally it stops the db window too
	 *
	 * @returns {DatabaseClientService}
	 */
	async stop(isHot = false):Promise<this> {
		await super.stop()
		return this
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
		return new Proxy({},new DatabaseProxy(this,repoClazz)) as any
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