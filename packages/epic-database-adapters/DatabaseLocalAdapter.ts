import { Stores } from "epic-database-client/Stores"
import { getDatabaseConfig } from "epic-database-client/DatabaseUtil"
import {
	Coordinator as TSCoordinator,
	Repo as TSRepo,
	IModel as TSIModel,
	FinderRequest
} from "typestore"
import { isPromise, isFunction, isNumber } from "typeguard"
import { PouchDBRepo, PouchDBPlugin } from "typestore-plugin-pouchdb"
import {
	getHot,
	setDataOnHotDispose,
	getValue
} from "epic-global"
import { watchChanges } from "./DatabaseChangeMonitor"
import { UserStoreImpl } from "./stores/UserStoreImpl"
import { IssueStoreImpl } from "./stores/IssueStoreImpl"
import { RepoStoreImpl } from "./stores/RepoStoreImpl"
import { AvailableRepoStoreImpl } from "./stores/AvailableRepoStoreImpl"
import { MilestoneStoreImpl } from "./stores/MilestoneStoreImpl"
import { CommentStoreImpl } from "./stores/CommentStoreImpl"
import { LabelStoreImpl } from "./stores/LabelStoreImpl"
import { IssuesEventStoreImpl } from "./stores/IssuesEventStoreImpl"
import { RepoEventStoreImpl } from "./stores/RepoEventStoreImpl"
import { GithubNotificationStoreImpl } from "./stores/GithubNotificationStoreImpl"
import { DatabaseAdapter } from "./DatabaseAdapter"
import { cleanupStoreName } from "./DatabaseAdapterUtil"


const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Local adapter implementation
 */
export class DatabaseLocalAdapter extends DatabaseAdapter {
	
	constructor() {
		super()
		
		// IN HMR RELOAD
		if (module.hot)
			DatabaseLocalAdapter.checkReloaded()
			
	}
	
	async start() {
		await DatabaseLocalAdapter.startAdapter()
	}
	
	async stop() {
		// Stop TypeStore Coordinator
		await DatabaseLocalAdapter.stopAdapter()
		 
	}
	
	/**
	 * Adapter is running
	 *
	 * @returns {PouchDBPlugin|TSCoordinator|boolean}
	 */
	isRunning():boolean {
		return DatabaseLocalAdapter.isStarted()
	}
	
	
	
	async closePluginDataContext(context:IPluginStoreContext):Promise<void> {
		const
			coordinator = getValue(() => context.internal.coordinator,null)
		
		if (!coordinator)
			return
		
		await coordinator.stop()
	}
	
	async createPluginDataContext(name:string,...modelConfigs:IPluginModelStoreConfig[]):Promise<IPluginStoreContext> {
		const
			coordinator = new TSCoordinator(),
			storePlugin = new PouchDBPlugin(getDatabaseConfig()),
			modelClazzes = modelConfigs.map(config => config.model),
			storeClazzes = modelConfigs.map(config => config.store),
			dataStores = {} as any,
			pluginContext = {
				name,
				internal: {
					coordinator,
					storePlugin
				},
				stores: dataStores
			} as IPluginStoreContext
		
		log.debug(`Initializing coordinator for ${name}`)
		await coordinator.init({}, storePlugin)
		
		try {
			log.debug(`Starting coordinator for ${name}`)
			await coordinator.start(...modelClazzes)
			
			storeClazzes.forEach((storeClazz:{new():TSRepo<any>}) => {
				const
					storeName = storeClazz.$$clazz || storeClazz.name
				
				const
					cleanStoreName = cleanupStoreName(storeName)
				
				log.debug(`Creating store (${cleanStoreName}) from ${storeName}`)
				dataStores[cleanStoreName] = coordinator.getRepo(storeClazz)
			})
		}	catch (err) {
			log.error(`Failed to start plugin data context`,err)
			
			log.debug(`Stopping coordinator due to error`)
			coordinator.stop()
			throw new err
		}
		return pluginContext
	}
	
	/**
	 * Get the underlying pouch db
	 *
	 * @param store
	 * @returns {any}
	 */
	getPouchDB(store:TSRepo<any>) {
		return (store as any).getPouchDB()
	}
	
	
	/**
	 * Execute a direct db call
	 *
	 * @param store
	 * @param name
	 * @param args
	 * @returns {any}
	 */
	direct(store:TSRepo<any>,name:string,...args) {
		return this.getPouchDB(store)[name](...args)
	}
	
	/**
	 * Get the current stores
	 *
	 * @returns {Stores}
	 */
	getStores():Stores {
		return DatabaseLocalAdapter.stores
	}
	
	/**
	 * Execute a request
	 *
	 * @param request
	 * @returns {IDatabaseResponse}
	 */
	async execute(request:IDatabaseRequest):Promise<IDatabaseResponse> {
		// Final Result
		let
			result,
			error
		
		const
			{ id:requestId, store:storeName, fn:fnName, args } = request,
			{stores,storePlugin} = DatabaseLocalAdapter
		
		try {
			
			
			if (storeName) {
				
				// Cleanup the store name
				const
					cleanStoreName = cleanupStoreName(storeName)
				
				// Find the store
				let
					store = stores[ storeName ] || stores[ cleanStoreName ]
				
				assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)
				
				if (fnName === 'db') {
					const
						dbFnName = args.shift()
					
					result = store.getPouchDB()[ dbFnName ](...args)
					
				} else {
					
					// Check finder options for limit
					if (args[ 0 ] && isNumber(args[ 0 ].limit))
						args[ 0 ] = new FinderRequest(args[ 0 ])
					
					// Get the results
					result = store[ fnName ](...args)
				}
				
			} else {
				result = await storePlugin.getDB(null)[ fnName ](...args)
				
			}
			
			// Ensure someone set a result
			assert(result, `Result can never be nil ${requestId}`)
			
			// If the result is a promise then wait
			if (isPromise(result) || isFunction(result.then))
				result = await result
			
			
		} catch (err) {
			log.error(`Failed to execute request`,request,err)
			error = err
		}
		
		return {
			requestId,
			result,
			error
		}
	}
	
}


/**
 * DatabaseLocalAdapter for local databases
 */
export namespace DatabaseLocalAdapter {
	
	
	export let
		pendingDBUpdate:Promise.Resolver<any>,
		
		// PouchDB Plugin
		storePlugin:PouchDBPlugin = getHot(module, 'storePlugin') as PouchDBPlugin,
		
		// TypeStore coordinator
		coordinator:TSCoordinator = getHot(module, 'coordinator') as TSCoordinator,
		
		// Stores Ref
		stores:Stores = getHot(module, 'storePlugin', new Stores())
	
	// HMR
	setDataOnHotDispose(module, () => ({
		storePlugin,
		coordinator,
		stores
	}))
	
	
	/**
	 * Is db starting
	 *
	 * @returns {Promise.Resolver<any>|boolean}
	 */
	export function isStarting() {
		return pendingDBUpdate && !pendingDBUpdate.promise.isResolved()
	}
	
	/**
	 * Is it started
	 *
	 * @returns {PouchDBPlugin|TSCoordinator|any}
	 */
	export function isStarted() {
		return storePlugin && coordinator && getValue(() => pendingDBUpdate.promise.isFulfilled(),false)
	}
	
	/**
	 * Wait for start
	 *
	 * @returns {Promise<void>}
	 */
	async function waitForStarted() {
		try {
			if (pendingDBUpdate && !pendingDBUpdate.promise.isResolved()) {
				await pendingDBUpdate.promise
			}
		} catch (err) {
			log.error(`Failed to start DB`)
		}
	}
	
	
	
	
	/**
	 * Retrieve store from coordinator
	 *
	 * @param repoClazz
	 * @returns {T}
	 */
	export function getStore<T extends TSRepo<M>,M extends TSIModel>(repoClazz:{new():T}):T {
		const
			store = coordinator.getRepo(repoClazz)
		
		assert(store instanceof TSRepo,`Store must be an instance of TSRepo`)
		return store
	}
	
	
	/**
	 * Get underlying pouch db instance
	 *
	 * @param store
	 * @returns {any}
	 */
	function getPouchDB(store:PouchDBRepo<any>):any {
		return getValue(() => store.getPouchDB(),null)
	}
	
	
	/**
	 * Check if the adapter was reloaded
	 */
	export function checkReloaded() {
		if (stores && coordinator) {
			watchChanges(stores,getPouchDB)
		}
	}
	
	/**
	 * Stop adapter
	 *
	 * @returns {Promise<void>}
	 */
	export async function stopAdapter() {
		if (!isStarted()) {
			return log.debug(`Can not stop database, not started`)
		}
		
		try {
			await coordinator.stop()
		} finally {
			coordinator = null
			storePlugin = null
			pendingDBUpdate = null
		}
	}
	
	/**
	 * Start adapter
	 *
	 * @returns {Promise<void>}
	 */
	export async function startAdapter() {
		
		if (isStarted())
			return
		
		pendingDBUpdate = Promise.defer()
		try {
			storePlugin = new PouchDBPlugin(getDatabaseConfig())
			
			coordinator = new TSCoordinator()
			
			//stores = stores || new Stores()
			
			await coordinator.init({}, storePlugin)
			
			const
				allModelsAndRepos = require('epic-models'),
				names = Object.keys(allModelsAndRepos)
			
			const modelClazzes = names
				.filter(name => {
					const
						val = allModelsAndRepos[ name ]
					
					return !_.endsWith(name, 'Store') && _.isFunction(val) && val.$$clazz
				})
				.map(name => {
					log.info(`Loading model class: ${name}`)
					return allModelsAndRepos[ name ]
				})
			
			await coordinator.start(...modelClazzes)
			
			log.debug('Coordinator started, loading repos')
			
			Object.assign(stores, {
				repo: getStore(RepoStoreImpl),
				issue: getStore(IssueStoreImpl),
				availableRepo: getStore(AvailableRepoStoreImpl),
				milestone: getStore(MilestoneStoreImpl),
				comment: getStore(CommentStoreImpl),
				label: getStore(LabelStoreImpl),
				user: getStore(UserStoreImpl),
				issuesEvent: getStore(IssuesEventStoreImpl),
				repoEvent: getStore(RepoEventStoreImpl),
				notification: getStore(GithubNotificationStoreImpl)
			})
			
			
			log.debug('Repos Loaded, subscribing to changes')
			
			
			// In DEBUG mode expose repos on global
			if (DEBUG) {
				assignGlobal({ Stores: stores })
			}
			
			log.debug(`Finally listen for changes`)
			watchChanges(stores, getPouchDB)
			
			// Now bind repos to the IOC
			Container.bind(Stores)
				.provider({ get: () => stores })
			
			pendingDBUpdate.resolve(true)
		} catch (err) {
			pendingDBUpdate.reject(err)
			throw err
		}
	}
	
	
}
