

const log = getLogger(__filename)

import {Singleton, AutoWired, Container, Scope} from 'typescript-ioc'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'

import {IService, ServiceStatus} from './IService'

import {getUserDataFilename} from 'shared/util/Files'
import {ActivityStore} from 'shared/models/Activity'
import {UserStore} from 'shared/models/User'
import {LabelStore} from 'shared/models/Label'
import {MilestoneStore} from 'shared/models/Milestone'
import {AvailableRepoStore} from 'shared/models/AvailableRepo'
import {RepoStore} from 'shared/models/Repo'
import {IssueStore} from 'shared/models/Issue'
import {CommentStore} from 'shared/models/Comment'

export async function chunkSave(models,modelStore) {
	const chunks = _.chunk(models,50)

	for (let chunk of chunks) {
		await modelStore.bulkSave(...chunk)
	}
}

export async function chunkRemove(modelIds) {
	const chunks = _.chunk(modelIds,50)
	const dbService:DBService = Container.get(DBService)
	const {db} = dbService
	assert(db,'could not get database reference in chunkRemove')

	for (let chunk of chunks) {
		await db.bulkDocs(chunk.map(_id => ({_id,_deleted:true})))
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
 * References to coordinator and plugins
 */


@AutoWired
@Singleton
export default class DBService implements IService {

	private _status = ServiceStatus.Created
	private _stores:Stores
	private _storePlugin:PouchDBPlugin

	coordinator:TSCoordinator
	dbName = `epictask-${Env.envName}-2`
	dbPath = getUserDataFilename(this.dbName + '.db')

	/**
	 * All global repositories
	 */

	get stores() {
		return this._stores
	}

	get db() {
		return this._storePlugin ? this._storePlugin.db : null
	}


	constructor() {
		this._stores = assign(new Stores(),{dbService:this})
		log.info('DB Path:',this.dbPath)
	}

	/**
	 * Create PouchDB store options
	 *
	 * @returns {{filename: string}}
	 */
	private storeOptions() {
		let opts = {filename: this.dbPath,cacheSize:32 * 1024 * 1024}
		if (Env.isDev) {
			opts = Object.assign({},opts, {
				replication: {
					to:   'http://127.0.0.1:5984/' + this.dbName,
					live:  true,
					retry: true
				}
			})
		}

		return opts
	}

	/**
	 * Service status
	 *
	 * @returns {ServiceStatus}
	 */
	status():ServiceStatus {
		return this._status
	}


	/**
	 * Initialize the service before anything is started
	 * @returns {DBService}
	 */
	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		this._storePlugin = new PouchDBPlugin(this.storeOptions())

		// If DEV then add deleteDatabase function
		if (Env.isDev) {
			_.assignGlobal({
				cleanDatabase: async () => {
					await this._storePlugin.deleteDatabase()
					await this.init()
					return this.start()
				},
				dbService:this
			})

		}

		return this
	}


	/**
	 * Start the service
	 *
	 * @returns {DBService}
	 */
	async start():Promise<this> {
		assert(this._status < ServiceStatus.Started,'Service is already started')
		assert(this._storePlugin,'StorePlugin is not initialized')


		this._status = ServiceStatus.Started

		/**
		 * init the coordinator
		 */
		this.coordinator = new TSCoordinator()
		await this.coordinator.init({}, this._storePlugin)

		const allModelsAndRepos = require('shared/models')
		const names = Object.keys(allModelsAndRepos)

		const modelClazzes = names
			.filter(name => {
				const val = allModelsAndRepos[name]
				return !_.endsWith(name,'Store') && _.isFunction(val)
			})
			.map(name => {
				log.info(`Loading model class: ${name}`)
				return allModelsAndRepos[name]
			})

		await this.coordinator.start(...modelClazzes)

		log.info('Coordinator started, loading repos')

		const {RepoStore,IssueStore,AvailableRepoStore,CommentStore,
			LabelStore,ActivityStore,MilestoneStore,UserStore} = allModelsAndRepos

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
		if (DEBUG) {
			_.assignGlobal({Repos:this._stores})
		}

		// Now bind repos to the IOC
		Container.bind(Stores)
			.provider({ get: () => this.stores })

		return this
	}


	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped
		return this
	}

	destroy():this {
		return this
	}


	/**
	 * Get a repo instance for the local database
	 *
	 * @param repoClazz
	 * @returns {T}
	 */

	getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
		return this.coordinator.getRepo(repoClazz)
	}
}


