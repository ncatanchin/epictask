
import {Singleton, AutoWired, Container, Scope} from 'typescript-ioc'
import {Repo as TSRepo, IModel} from 'typestore'
import {ServiceStatus, BaseService} from './IService'
import Electron = require('electron')
import {Stores} from 'shared/Stores'
import {loadModelClasses} from 'main/db/DBTool'


const CHUNK_SIZE = 50

const log = getLogger(__filename)

const {app,BrowserWindow,ipcMain} = Electron


function getDatabaseServerWindow() {
	return require('main/db/DatabaseServerWindow').getDatabaseServerWindow()
}

// Re-export stores
export {
	Stores
}

/**
 * Bulk save models
 *
 * @param models
 * @param modelStore
 */
export async function chunkSave(models,modelStore) {
	const chunks = _.chunk(models,CHUNK_SIZE)

	for (let chunk of chunks) {
		await modelStore.bulkSave(...chunk)
	}
}

/**
 * Bulk remove models
 *
 * @param modelIds
 */
export async function chunkRemove(modelIds) {

	modelIds = _.uniq(modelIds.map(modelId => `${modelId}`))

	const chunks = _.chunk(modelIds,CHUNK_SIZE)
	const dbService:DBService = Container.get(DBService)
	const {dbProxy} = dbService
	assert(dbProxy,'could not get database reference in chunkRemove')

	for (let chunk of chunks) {
		await dbProxy.bulkDocs(chunk.map(_id => ({_id,_deleted:true})))
	}
}



/**
 * Database Client proxy
 */
class DBProxy {

	private fnMap = {}
	private store:string

	constructor(private dbService,private repoClazz = null) {
		this.store = (!repoClazz) ? null :
			(repoClazz.name || _.get(repoClazz,'prototype.constructor.name'))
	}

	/**
	 * Proxy function, first attempts to use map
	 *
	 * @param target
	 * @param name
	 * @returns {any|((args:...[any])=>undefined)}
	 */
	get(target,name) {

		const proxyFn = this.fnMap[name] || (
			this.fnMap[name] = (...args) => {
				log.info(`Proxy request for ${name}`)

				const dbWindow = getDatabaseServerWindow()
				return dbWindow.request(this.store,name,args)
			}
		)

		log.info(`Getting proxy for ${name}`)
		return proxyFn
	}

}



/**
 * References to coordinator and plugins
 */

//@AutoWired
//@Singleton
export class DBService extends BaseService {

	private _stores:Stores

	dbWindow
	dbProxy

	/**
	 * All global repositories
	 */

	get stores() {
		return this._stores
	}

	// get db() {
	// 	return this._storePlugin ? this._storePlugin.db : null
	// }


	constructor() {
		super()
		this._stores = assign(new Stores(),{dbService:this})

	}


	private loadDatabaseServerWindow() {
		log.info('Getting DB Window')

		this.dbWindow = getDatabaseServerWindow()

		log.info('Starting db window')
		return this.dbWindow.start()
	}


	private stopDatabaseServerWindow(isHot = false) {
		log.info("Closing database server window")

		this.dbWindow = null
	}
	/**
	 * Initialize the service before anything is started
	 * @returns {DBService}
	 */
	async init():Promise<this> {
		await super.init()




		// If DEV then add deleteDatabase function
		// if (Env.isDev) {
		// 	_.assignGlobal({
		// 		cleanDatabase: async () => {
		// 			await this._storePlugin.deleteDatabase()
		// 			await this.init()
		// 			return this.start()
		// 		},
		// 		dbService:this
		// 	})
		//
		// }

		return this.loadDatabaseServerWindow()
	}


	/**
	 * Start the service
	 *
	 * @returns {DBService}
	 */
	async start():Promise<this> {
		assert(this.status() < ServiceStatus.Started,'Service is already started')

		await super.start()

		// Load all model classes
		const modelClazzes = loadModelClasses()


		// Load all
		const {RepoStore,IssueStore,AvailableRepoStore,CommentStore,
			LabelStore,ActivityStore,MilestoneStore,UserStore} = require('shared/models')

		Object.assign(this._stores, {
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
			_.assignGlobal({Repos:this._stores})
		}

		// Now bind repos to the IOC
		Container.bind(Stores)
			.provider({ get: () => this.stores })

		return this
	}


	/**
	 * Stop the database service,
	 * internally it stops the db window too
	 *
	 * @returns {DBService}
	 */
	async stop(isHot = false):Promise<this> {
		await super.stop()
		//this.stopDatabaseServerWindow(isHot)
		return this
	}

	destroy(isHot = false):this {
		super.destroy()
		//this.stopDatabaseServerWindow(isHot)
		return this
	}


	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}Í
	 */Í

	getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
		return new Proxy({},new DBProxy(this,repoClazz)) as any
	}
}


export default DBService