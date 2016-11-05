
import { Stores, IDatabaseRequest, DatabaseEvents } from "epic-database-client"

import { Coordinator as TSCoordinator, Repo as TSRepo, IModel, FinderRequest } from "typestore"

import {
	tempFilename, getUserDataFilename, acceptHot, addHotDisposeHandler, getHot,
	setDataOnHotDispose, getValue,uuid
} from "epic-global"

import { watchChanges } from "./DatabaseChangeMonitor"
import { isPromise, isFunction } from "typeguard"
import { PouchDBRepo,IPouchDBOptions, PouchDBPlugin } from "typestore-plugin-pouchdb"


import { UserStoreImpl } from "./stores/UserStoreImpl"
import { IssueStoreImpl } from "./stores/IssueStoreImpl"
import { RepoStoreImpl } from "./stores/RepoStoreImpl"
import { AvailableRepoStoreImpl } from "./stores/AvailableRepoStoreImpl"
import { MilestoneStoreImpl } from "./stores/MilestoneStoreImpl"
import { CommentStoreImpl } from "./stores/CommentStoreImpl"
import { LabelStoreImpl } from "./stores/LabelStoreImpl"
import { IssuesEventStoreImpl } from "./stores/IssuesEventStoreImpl"
import { RepoEventStoreImpl } from "./stores/RepoEventStoreImpl"
import { DatabaseAdapter } from "epic-database-adapters/DatabaseAdapter"
import { IDatabaseResponse } from "epic-database-client/DatabaseRequestResponse"

const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)




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
	R
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
				const storeName2 = _.camelCase(storeName.replace(/Store$/i, ''))
				
				// Find the store
				let
					store = stores[ storeName ] || stores[ storeName2 ]
				
				assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)
				
				if (fnName === 'db') {
					const
						dbFnName = args.shift()
					
					result = store.getPouchDB()[ dbFnName ](...args)
					
				} else {
					
					// Check finder options for limit
					if (args[ 0 ] && _.isNumber(args[ 0 ].limit))
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


export namespace DatabaseLocalAdapter {
	
	const
		dbName = Env.isTest ?
			`epictask-test-${uuid()}` :
			`epictask-${Env.envName}`,
		
		dbPath = Env.Config.UseIndexedDB ? dbName : Env.isTest ?
			tempFilename(dbName + '.db') :
			getUserDataFilename(dbName + '.db')
	
	log.debug('DB Path:', dbPath)
	
	
	export let
		// PouchDB Plugin
		storePlugin:PouchDBPlugin = getHot(module, 'storePlugin') as PouchDBPlugin,
		
		// TypeStore coordinator
		coordinator:TSCoordinator = getHot(module, 'coordinator') as TSCoordinator,
		
		// Stores Ref
		stores:Stores = getHot(module, 'storePlugin', new Stores())
	
	setDataOnHotDispose(module, () => ({
		storePlugin,
		coordinator,
		stores
	}))
	
	
	/**
	 * Create PouchDB store options
	 *
	 * @returns {{filename: string}}
	 */
	function storeOptions() {
		
		const
			opts:IPouchDBOptions = Object.assign(
				// OPTIONS FOR LEVEL & INDEXED
				{
					// 1 DB PER MODEL/REPO
					databasePerRepo: true,
					
					// FILENAME
					filename: dbPath,
					
					// OVERWRITE ON CONFLICT
					overwriteConflicts: true
				},
				
				// OPTIONS ONLY FOR LEVELDB
				Env.Config.UseIndexedDB  ? {} : {
				
				// BIG CACHE SIZE
				cacheSize: 32 * 1024 * 1024
			
			})
	
		
		log.debug(`Created store opts`, opts)
		
		return opts
	}
	
	
	/**
	 * Retrieve store from coordinator
	 *
	 * @param repoClazz
	 * @returns {T}
	 */
	export function getStore<T extends TSRepo<M>,M extends IModel>(repoClazz:{new():T}):T {
		const
			store = coordinator.getRepo(repoClazz)
		
		assert(store instanceof TSRepo,`Store must be an instance of TSRepo`)
		return store
	}
	
	
	function getPouchDB(store:PouchDBRepo<any>):any {
		return getValue(() => store.getPouchDB(),null)
	}
	
	
	export function checkReloaded() {
		if (stores && coordinator) {
			watchChanges(stores,getPouchDB)
		}
	}
	
	
	export async function stopAdapter() {
		await coordinator.stop()
		
		coordinator = null
		storePlugin = null
		stores = null
	}
	
	export async function startAdapter() {
		
		if (storePlugin && coordinator)
			return
		
		
		storePlugin = new PouchDBPlugin(storeOptions())
		
		coordinator = new TSCoordinator()
		
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
			repoEvent: getStore(RepoEventStoreImpl)
		})
		
		
		log.debug('Repos Loaded, subscribing to changes')
		
		
		
		
		// In DEBUG mode expose repos on global
		if (DEBUG) {
			assignGlobal({ Stores: stores })
		}
		
		log.debug(`Finally listen for changes`)
		watchChanges(stores,getPouchDB)
		
		// Now bind repos to the IOC
		Container.bind(Stores)
			.provider({ get: () => stores })
		
	}
	
	
	
	
}
