
const {PouchDB} = require('./PouchDBSetup')
const Bluebird = require('bluebird')


import {
	ICoordinator,
	ICoordinatorOptions,
	Repo,
	IModel,
	PluginType,
	IStorePlugin,
	Log,
	PluginEventType,
	repoAttachIfSupported,
	IModelAttributeOptions,
	assert
} from 'typestore'


import {PouchDBPKIndex,PouchDBTypeIndex} from './PouchDBConstants'
import {PouchDBRepoPlugin} from "./PouchDBRepoPlugin";
import {getIndexMap,makeMangoIndex} from './PouchDBIndexes'


const log = Log.create(__filename)

export interface IPouchDBReplication {
	to:string
	live?:boolean
	retry?:boolean
}

/**
 * Options interface
 */
export interface IPouchDBOptions {

	filename:string
	createOptions?:any
	replication?: IPouchDBReplication
}

/**
 * Default options
 */
export const PouchDBOptionDefaults = {
	filename:null
}

/**
 * Uses dexie under the covers - its a mature library - and i'm lazy
 */
export class PouchDBPlugin implements IStorePlugin {

	type = PluginType.Store

	supportedModels:any[]

	private coordinator:ICoordinator
	private internalDb:any
	private syncHandler:any
	private schema:any
	private repoPlugins:{[modelName:string]:PouchDBRepoPlugin<any>} = {}

	constructor(private opts:IPouchDBOptions,...supportedModels:any[]) {
		this.opts = Object.assign({},PouchDBOptionDefaults,opts)
		assert(this.opts.filename,'A valid database path is required')

		this.supportedModels = supportedModels
	}

	private newPouch() {
		return new PouchDB(this.opts.filename,this.opts.createOptions || {})
	}

	private async open() {
		const db = await this.newPouch()

		const {replication} = this.opts
		if (replication && replication.to) {
			const remoteDB = new PouchDB(replication.to)
			this.syncHandler = PouchDB.replicate(db,remoteDB,{
				live: replication.live,
				retry: replication.retry
			})
			// this.syncHandler = db.sync(remoteDB,{
			// 	live: replication.live,
			// 	retry: replication.retry
			// })
		}

		this.internalDb = db
		return db


	}

	get db() {
		assert(this.internalDb,'Database is not ready yet')
		return this.internalDb
	}


	handle(eventType:PluginEventType, ...args):boolean|any {
		switch(eventType) {
			case PluginEventType.RepoInit:
				return repoAttachIfSupported(args[0] as Repo<any>, this)
		}
		return false
	}



	init(coordinator:ICoordinator, opts:ICoordinatorOptions):Promise<ICoordinator> {
		this.coordinator = coordinator
		return Bluebird.resolve(coordinator)
	}



	start():Promise<ICoordinator> {
		const models = this.coordinator.getModels()

		log.debug(`Opening database`,this.opts.filename)

		return this.open()
			.then(db => {
				log.info('Database is open, grabbing info')
				return db.info()
					.then(info => {
						log.info('DB Info',info)
						return db
					})

				// return db.getIndexes()
				// 	.then(existingIndexes => {
				// 		log.info('Existing Indexes',existingIndexes)
				// 		return db
				// 	})
			})
			.then(async (db) => {
				await makeMangoIndex(db,null,PouchDBTypeIndex,'asc',['type'])
				// const makeIndexPromises = [
				//
				// ]

				const indexArgs = []

				// Create any/all indexes
				this.schema = models.reduce((newSchema,modelType) => {

					// Get all the known attributes for the table
					const attrs = modelType.options.attrs
						.filter(attr => !attr.transient)


					const attrDetails = attrs.reduce((newDetails,attr:IModelAttributeOptions) => {
						const
							{index,name,primaryKey,isArray} = attr

						if (attr.secondaryKey)
							throw new Error('Secondary keys are not supported in pouchdb')


						if (index) {
							if (primaryKey)
								throw new Error('You can not specify a second index on the primary key')

							indexArgs.push([db,modelType.name,index.name || name,'asc',[name]])
						}

						if (primaryKey) {
							indexArgs.push([db,modelType.name,PouchDBPKIndex,'asc',[name,'type']])
						}

						newDetails[name] = attr

						return newDetails
					},{})



					// Added the attribute descriptor to the new schema
					newSchema[modelType.name] = {
						name: modelType.name,
						attrNames: Object.keys(attrDetails),
						attrs: attrDetails
					}
					log.debug(`Created schema for ${modelType.name}`,newSchema[modelType.name])
					return newSchema
				},{})

				await Bluebird.each(indexArgs,async (args) => {
					await makeMangoIndex.apply(null,args)
				})

				//await Bluebird.each(makeIndexPromises)
				// Wait for indexes
				return this.coordinator

			})



	}

	deleteDatabase():Promise<any> {
		return this.internalDb.destroy()
	}

	async stop():Promise<ICoordinator> {
		if (this.internalDb)
			try {
				await new Promise((resolve, reject) => {
					this.internalDb.close(() => {
						log.info('Database closed')
						resolve()
					})
				})
			} catch (err) {
				log.error('Failed to shutdown db',err)
			}

		return this.coordinator
	}

	syncModels():Promise<ICoordinator> {
		log.debug('Currently the localstorage plugin does not sync models')
		return Promise.resolve(this.coordinator)
	}

	/**
	 * Initialize a new repo
	 * TODO: verify this logic works - just reading it makes me think we could be
	 *  asked to init a repo a second time with the same type and do nothing
	 *
	 * @param repo
	 * @returns {T}
	 */
	initRepo<T extends Repo<M>, M extends IModel>(repo:T):T {
		let plugin = this.repoPlugins[repo.modelType.name]
		if (plugin)
			return plugin.repo as T

		plugin = new PouchDBRepoPlugin(this,repo)
		return plugin.repo as T
	}
}