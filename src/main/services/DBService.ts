

const log = getLogger(__filename)

import {Singleton, AutoWired, Container, Scope} from 'typescript-ioc'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'

import {IService, ServiceStatus, BaseService} from './IService'

import {getUserDataFilename} from 'shared/util/Files'
import {ActivityStore} from 'shared/models/Activity'
import {UserStore} from 'shared/models/User'
import {LabelStore} from 'shared/models/Label'
import {MilestoneStore} from 'shared/models/Milestone'
import {AvailableRepoStore} from 'shared/models/AvailableRepo'
import {RepoStore} from 'shared/models/Repo'
import {IssueStore} from 'shared/models/Issue'
import {CommentStore} from 'shared/models/Comment'

import Electron = require('electron')
const {app,BrowserWindow,ipcMain} = Electron

export async function chunkSave(models,modelStore) {
	const chunks = _.chunk(models,50)

	for (let chunk of chunks) {
		await modelStore.bulkSave(...chunk)
	}
}

export async function chunkRemove(modelIds) {

	modelIds = _.uniq(modelIds.map(modelId => `${modelId}`))

	const chunks = _.chunk(modelIds,50)
	const dbService:DBService = Container.get(DBService)
	const {dbProxy} = dbService
	assert(dbProxy,'could not get database reference in chunkRemove')

	for (let chunk of chunks) {
		await dbProxy.bulkDocs(chunk.map(_id => ({_id,_deleted:true})))
	}
}

export class Stores {

	dbService:DBService

	constructor() {}

	issue:IssueStore
	repo: RepoStore
	availableRepo: AvailableRepoStore
	milestone: MilestoneStore
	comment: CommentStore
	label: LabelStore
	activity: ActivityStore
	user: UserStore

	getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
		return this.dbService.getStore(repoClazz)
	}
}

/**
 * Database Client proxy
 */
class DBProxy {

	constructor(private repoClazz = null) {

	}

	get(target,name) {

	}

}

export function loadModelClasses() {
	const allModelsAndRepos = require('shared/models')
	const names = Object.keys(allModelsAndRepos)

	return names
		.filter(name => {
			const val = allModelsAndRepos[name]
			return !_.endsWith(name,'Store') && _.isFunction(val)
		})
		.map(name => {
			log.info(`Loading model class: ${name}`)
			return allModelsAndRepos[name]
		})
}

/**
 * References to coordinator and plugins
 */

@AutoWired
@Singleton
export class DBService extends BaseService {

	private _stores:Stores

	dbName = `epictask-${Env.envName}-2`
	dbPath = getUserDataFilename(this.dbName + '.db')
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
		log.info('DB Path:',this.dbPath)
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

		return this
	}


	/**
	 * Start the service
	 *
	 * @returns {DBService}
	 */
	async start():Promise<this> {
		assert(this.status() < ServiceStatus.Started,'Service is already started')

		await super.start()



		const modelClazzes = loadModelClasses()



		log.info('Coordinator started, loading repos')

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


	async stop():Promise<this> {
		await super.stop()
		this._status = ServiceStatus.Stopped
		return this
	}

	destroy():this {
		super.destroy()
		return this
	}


	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}
	 */

	getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
		return new Proxy({},new DBProxy(repoClazz)) as any
	}
}


export default DBService