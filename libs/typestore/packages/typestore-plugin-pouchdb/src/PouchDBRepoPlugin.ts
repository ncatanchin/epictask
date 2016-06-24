//import * as PouchDB from 'pouchdb'

import {
	IRepoPlugin,
	IKeyValue,
	PluginType,
	IModel,
	Repo,
	ICoordinator,
	ICoordinatorOptions,
	PluginEventType,
	IFinderPlugin,
	IModelMapper,
	ModelPersistenceEventType,
	getFinderOpts,
	assert,
	Log,
	isFunction,
	IModelAttributeOptions
} from 'typestore'

import {enableQuickSearch} from './PouchDBSetup'
import {makeMangoIndex,getIndexByNameOrFields} from './PouchDBIndexes'
import {PouchDBPlugin} from "./PouchDBPlugin";
import {PouchDBAttributePrefix,PouchDBOperators}
	from "./PouchDBConstants";

import {
	IPouchDBMangoFinderOptions,
	IPouchDBFilterFinderOptions,
	IPouchDBFnFinderOptions,
	IPouchDBFullTextFinderOptions
} from './PouchDBDecorations'

import {mapDocs, mapAttrsToField, transformDocumentKeys, dbKeyFromObject, convertModelToDoc} from './PouchDBUtil'
import {makeMangoFinder, makeFilterFinder, makeFnFinder, makeFullTextFinder, findWithSelector} from './PouchDBFinders'

const log = Log.create(__filename)


/**
 * Super simple plain jain key for now
 * what you send to the constructor comes out the
 * other end
 *
 * just like poop!
 */
export class PouchDBKeyValue implements IKeyValue {

	public args:any[]

	pouchDBKey = true

	constructor(...args:any[]) {
		this.args = args
	}
}

export class PouchDBRepoPlugin<M extends IModel> implements IRepoPlugin<M>, IFinderPlugin {

	type = PluginType.Repo | PluginType.Finder
	supportedModels:any[]

	private coordinator
	modelType
	private primaryKeyAttr:IModelAttributeOptions

	/**
	 * Construct a new repo/store
	 * manager for a given repo/model
	 *
	 * @param store
	 * @param repo
	 */
	constructor(private store:PouchDBPlugin, public repo:Repo<M>) {
		this.supportedModels = [repo.modelClazz]
		this.modelType = this.repo.modelType
		this.primaryKeyAttr = this.modelType.options.attrs
			.find(attr => attr.primaryKey)



		repo.attach(this)
	}



	/**
	 * Create a finder method with descriptor
	 * and signature
	 *
	 * @param repo
	 * @param finderKey
	 * @returns {any}
	 */
	decorateFinder(repo:Repo<any>, finderKey:string) {

		// Get the finder opts 1st
		const opts = getFinderOpts(repo,finderKey) as
			IPouchDBFnFinderOptions &
			IPouchDBFilterFinderOptions &
			IPouchDBMangoFinderOptions &
			IPouchDBFullTextFinderOptions

		if (!opts )
			return null

		const { fn, filter, selector,
			sort, limit, single,
			textFields, all
		} = opts



		assert(all || fn || selector || filter || textFields,'selector or fn properties MUST be provided on an pouchdb finder descriptor')

		const finderFn:any = (selector || all) ? makeMangoFinder(this,finderKey,opts) :
			(filter) ? makeFilterFinder(this,finderKey,opts) :
				(textFields) ? makeFullTextFinder(this,finderKey,opts) :
					makeFnFinder(this,finderKey,opts)

		return async (...args) => {
			const models = await finderFn(...args)

			log.debug('Got finder result for ' + finderKey,'args',args,'models',models)
			return (single) ? models[0] : models

		}
	}

	/**
	 * Handle a plugin event
	 *
	 * @param eventType
	 * @param args
	 * @returns {boolean}
	 */
	handle(eventType:PluginEventType, ...args):boolean|any {
		return false;
	}

	/**
	 * Model mapper
	 *
	 * @returns {IModelMapper<M>}
	 */
	get mapper():IModelMapper<M> {
		return this.repo.getMapper(this.repo.modelClazz)
	}

	/**
	 * Get db ref
	 *
	 * @returns {Dexie}
	 */
	get db() {
		return this.store.db
	}


	async init(coordinator:ICoordinator, opts:ICoordinatorOptions):Promise<ICoordinator> {
		return (this.coordinator = coordinator)
	}

	async start():Promise<ICoordinator> {
		return this.coordinator
	}

	async stop():Promise<ICoordinator> {
		return this.coordinator
	}

	key(...args):PouchDBKeyValue {
		return new PouchDBKeyValue(...args);
	}

	private extractKeyValue(val:PouchDBKeyValue|any):any {
		val = val.pouchDBKey ? val.args[0] : val
		return val
	}

	async get(key:PouchDBKeyValue):Promise<M> {
		key = this.extractKeyValue(key)

		const result = await findWithSelector(this,{[this.primaryKeyAttr.name]: key})

		if (result && result.docs.length > 1)
			throw new Error(`More than one database object returned for key: ${key}`)

		return mapDocs(this.repo.modelClazz,result)[0] as M
	}


	/**
	 * Retrieve the rev for a model id
	 *
	 * @param id
	 * @returns {null}
	 */
	async getRev(id:any):Promise<string> {
		const model:any = await this.get(id)
		return (model) ? model.$$doc._rev : null
	}

	async save(model:M):Promise<M> {
		const mapper = this.mapper
		const json = mapper.toObject(model)

		const doc = convertModelToDoc(
			this.modelType,
			mapper,
			this.primaryKeyAttr.name,
			model
		)

		const id = model[this.primaryKeyAttr.name]
		if (id && doc._id && !doc._rev) {
			const rev = await this.getRev(id)
			if (rev) {
				doc._rev = rev
			}
		}


		try {
			const res:any = await this.db[doc._id ? 'put' : 'post'](doc)

			const savedModel = mapper.fromObject(json)
			Object.assign(savedModel as any,{$$doc: {_id: res.id, '_rev': res.rev,attrs:json}})

			this.repo.triggerPersistenceEvent(ModelPersistenceEventType.Save, savedModel)

			return savedModel as M

		} catch (err) {
			log.error('Failed to persist model',err)
			log.error('Failed persisted json',json,model)

			throw err
		}
	}

	/**
	 * Remove implementation
	 *
	 * @param key
	 * @returns {Promise<void>}
	 */
	async remove(key:PouchDBKeyValue):Promise<any> {
		key = key.pouchDBKey ? key : this.key(key as any)

		const model = await this.get(key)


		if (!model)
			return null

		const result = await this.db.remove((model as any).$$doc)

		if (this.repo.supportPersistenceEvents())
			this.repo.triggerPersistenceEvent(ModelPersistenceEventType.Remove,model)

		return Promise.resolve(result);
	}

	//TODO: make count efficient
	async count():Promise<number> {
		const result = await this.all(false)
		return !result ? 0 : result.length

	}

	async all(includeDocs = true) {
		//return this.findWithSelector({},null,null,null,includeDocs)
		const result = await this.db.allDocs({include_docs:true})

		const docs = result.rows
			.reduce((allDocs,nextRow) => {
				allDocs.push(nextRow.doc)
				return allDocs
			},[])
			.filter(doc => doc.type === this.modelType.name)

		return mapDocs(this.repo.modelClazz,docs)
	}

	/**
	 * Bulk get
	 *
	 * @param keys
	 * @returns {any}
	 */
	async bulkGet(...keys:PouchDBKeyValue[]):Promise<M[]> {
		keys = keys.map(key => (key.pouchDBKey) ? key.args[0] : key)

		return await Promise.all(keys.map(key => this.get(key)))
	}

	/**
	 * Bulk save/put
	 *
	 * @param models
	 * @returns {M[]}
	 */
	async bulkSave(...models:M[]):Promise<M[]> {
		const mapper = this.repo.getMapper(this.repo.modelClazz)
		const jsons = []

		// Models -> Docs
		const docs = models.map(model => convertModelToDoc(
			this.modelType,
			mapper,
			this.primaryKeyAttr.name,
			model
		))

		// Find all docs that have _id and not _rev
		docs
			.forEach(async (doc,index) => {
				const id = models[index][this.primaryKeyAttr.name]
				if (!id || !doc._id  || (doc._id && doc._rev))
					return

				const rev = await this.getRev(id)
				if (rev) {
					doc._rev = rev
				}
			})

		// Do Save
		const responses = await this.db.bulkDocs(docs)

		// Docs -> Models
		const savedModels = jsons.map((json,index) => {
			const savedModel = mapper.fromObject(json)

			const res = responses[index]
			Object.assign(savedModel as any,{
				$$doc: {
					_id: res.id,
					_rev: res.rev,
					attrs:json
				}
			})

			return savedModel
		})

		if (this.repo.supportPersistenceEvents())
			this.repo.triggerPersistenceEvent(ModelPersistenceEventType.Save,...savedModels)

		return savedModels
	}

	/**
	 * Bulk remove
	 *
	 * @param keys
	 * @returns {PouchDBKeyValue[]}
	 */
	async bulkRemove(...keys:PouchDBKeyValue[]):Promise<any[]> {
		const models = await this.bulkGet(...keys)

		await Promise.all(models.map((model:any) => this.db.remove(model.$$doc)))

		if (this.repo.supportPersistenceEvents())
			this.repo.triggerPersistenceEvent(ModelPersistenceEventType.Remove,...models)

		return keys
	}

}