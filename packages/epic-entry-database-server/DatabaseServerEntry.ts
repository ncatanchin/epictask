import "epic-entry-shared/AppEntry"



import { PouchDBRepo,IPouchDBOptions, PouchDBPlugin } from "typestore-plugin-pouchdb"

import { loadProcessClientEntry } from "epic-entry-shared"
import { Coordinator as TSCoordinator, Repo as TSRepo, IModel, FinderRequest } from "typestore"

const
	{ProcessClientEntry} = loadProcessClientEntry()

import { Stores, IDatabaseRequest, DatabaseEvents, IDatabaseChange } from "epic-database-client"

import {
	tempFilename, getUserDataFilename, acceptHot, addHotDisposeHandler, getHot,
	setDataOnHotDispose, getValue,uuid
} from "epic-global"
import { ProcessNames, ProcessType } from "epic-entry-shared/ProcessType"

import { makeIPCServerId } from "epic-net"
import { UserStoreImpl } from "./stores/UserStoreImpl"
import { IssueStoreImpl } from "./stores/IssueStoreImpl"
import { RepoStoreImpl } from "./stores/RepoStoreImpl"
import { AvailableRepoStoreImpl } from "./stores/AvailableRepoStoreImpl"
import { MilestoneStoreImpl } from "./stores/MilestoneStoreImpl"
import { CommentStoreImpl } from "./stores/CommentStoreImpl"
import { LabelStoreImpl } from "./stores/LabelStoreImpl"
import { IssuesEventStoreImpl } from "./stores/IssuesEventStoreImpl"
import { RepoEventStoreImpl } from "./stores/RepoEventStoreImpl"

// Logger
const
	log = getLogger(__filename),
	
	// IPC
	ipc = getHot(module, 'ipc', require('node-ipc'))


// DEBUG LOGGING
//log.setOverrideLevel(LogLevel.DEBUG)


let
	startDeferred:Promise.Resolver<any> = getHot(module, 'startDeferred', null)

ipc.config.id = makeIPCServerId(ProcessNames.DatabaseServer)
ipc.config.retry = 1500
ipc.config.silent = true

// Database name and path
const
	
	dbName = Env.isTest ?
		`epictask-test-${uuid()}` :
		`epictask-${Env.envName}`,
	
	dbPath = Env.isTest ?
		tempFilename(dbName + '.db') :
		getUserDataFilename(dbName + '.db')

log.debug('DB Path:', dbPath)

let
	// PouchDB Plugin
	storePlugin:PouchDBPlugin = getHot(module, 'storePlugin') as PouchDBPlugin,
	
	// TypeStore coordinator
	coordinator:TSCoordinator = getHot(module, 'coordinator') as TSCoordinator,
	
	// Stores Ref
	stores:Stores = getHot(module, 'storePlugin', new Stores()),
	
	changeSubscriptions = getHot(module,'changeSubscriptions',M<string,any>())

setDataOnHotDispose(module, () => ({
	storePlugin,
	coordinator,
	stores,
	startDeferred,
	changeSubscriptions,
	ipc
}))

/**
 * Create PouchDB store options
 *
 * @returns {{filename: string}}
 */
function storeOptions() {
	
	const
		opts:IPouchDBOptions = {
			
			// FILENAME
			filename: dbPath,
			
			// BIG CACHE SIZE
			cacheSize: 32 * 1024 * 1024,
			
			// 1 DB PER MODEL/REPO
			databasePerRepo: true,
			
			// OVERWRITE ON CONFLICT
			overwriteConflicts: true
		}
	
	log.debug(`Created store opts`, opts)
	
	return opts
}


function getPouchDB(store:PouchDBRepo<any>):any {
	return getValue(() => store.getPouchDB(),null)
}

/**
 * Subscribe to the changes feed in pouchdb
 */
function updateChangeSubscriptions() {
	Object
		.values(stores)
		.filter(store => store instanceof PouchDBRepo && getPouchDB(store))
		.forEach((store:PouchDBRepo<any>) => {
			
			const
				modelType = store.modelType.name
			
			if (changeSubscriptions[modelType]) {
				log.debug(`Unsubscribing: ${modelType}`)
				try {
					changeSubscriptions[modelType].cancel()
				} catch (err) {
					log.error(`Failed to unsubscribe: ${modelType}`,err)
				}
				changeSubscriptions[modelType] = null
			}
			
			log.debug(`Subscribing ${modelType}`)
			
			const
				db = store.getPouchDB(),
				changes = changeSubscriptions[modelType] = db.changes({
					live: true,
					since: 'now',
					include_docs: true
				})
			
			changes.on('change',(info) => {
				log.debug(`Change received for type: ${modelType}`,info)
				try {
					const
						doc = info.doc || {},
						model = doc && doc.type === modelType && store.getModelFromObject(doc),
						change:IDatabaseChange = doc && {
							id: info.id,
							rev: getValue(() => info.doc._rev),
							deleted: getValue(() => info.doc._deleted,false),
							doc,
							clazz: store.modelClazz as any,
							type: modelType,
							model
						}
					
					if (!model) {
						log.debug(`No model on update`,info)
						return
					}
					
					log.debug(`Broadcasting change`,change)
					ipc.server.broadcast(DatabaseEvents.Change,change)
				} catch (err) {
					log.error(`Failed to broadcast changes`,info,err)
				}
			})
			
			changes.on('error',err => {
				log.error(`An error occurred while listening for changes to ${modelType}`,err)
			})
			
		})
}


/**
 * Retrieve store from coordinator
 *
 * @param repoClazz
 * @returns {T}
 */
function getStore<T extends TSRepo<M>,M extends IModel>(repoClazz:{new():T}):T {
	const
		store = coordinator.getRepo(repoClazz)
	
	assert(store instanceof TSRepo,`Store must be an instance of TSRepo`)
	return store
}


/**
 * Database entry
 */
export class DatabaseServerEntry extends ProcessClientEntry {
	
	constructor() {
		super(ProcessType.DatabaseServer)
		
		// IN HMR RELOAD
		if (module.hot && stores && startDeferred) {
			updateChangeSubscriptions()
		}
	}
	
	/**
	 * Services are disabled on the database server
	 *
	 * @returns {boolean}
	 */
	servicesEnabled() {
		return false
	}
	
	/**
	 * Start the database server
	 *
	 * @returns {Promise<any>}
	 */
	protected async start() {
		
		// ONLY START ONCE
		if (startDeferred)
			return startDeferred.promise
		
		
		// CREATE DEFERRED PROMISE
		startDeferred = Promise.defer()
		try {
			
			log.info('Starting Database Server')
			
			
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
			
			// Now bind repos to the IOC
			Container.bind(Stores)
				.provider({ get: () => stores })
			
			
			log.info('Starting IPC Server')
			
			// Configure IPC Server
			ipc.serve(() => {
				ipc.server.on(DatabaseEvents.Request, async(request, socket) => {
					await executeRequest(socket, request)
				})
				
				// Notify StateServer
				log.info('DatabaseServer is ready - notifying worker owner')
				startDeferred.resolve()
			})
			
			//Start IPC Server
			ipc.server.start()
			
			
		} catch (err) {
			log.error('start failed', err)
			startDeferred.reject(err)
			throw err
		}
		
		await startDeferred.promise.timeout(10000, "Database server took too long")
		
		log.debug(`Finally listen for changes`)
		updateChangeSubscriptions()
	}
	
	
	
	/**
	 * Stop the database server
	 */
	protected stop():Promise<any> {
		// Stop ipc server
		ipc.server && ipc.server.stop && ipc.server.stop()
		
		// Stop TypeStore Coordinator
		const
			coordinatorStopPromise = coordinator.stop()
		
		coordinator = null
		
		// Return TypeStore stop promise
		return coordinatorStopPromise
	}
}

/**
 * Send response to request
 *
 * @param socket
 * @param request
 * @param result
 * @param error
 */
function respond(socket, request:IDatabaseRequest, result, error:Error = null) {
	const response = {
		requestId: request.id,
		result,
		error
	}
	
	log.debug('Sending response', response)
	ipc.server.emit(socket, DatabaseEvents.Response, response)
	//ipcRenderer.send(DatabaseEvents.Response,{requestId:request.id,result,error})
}

/**
 * Execute a request
 *
 * @param socket
 * @param request
 */
async function executeRequest(socket, request:IDatabaseRequest) {
	try {
		const { id:requestId, store:storeName, fn:fnName, args } = request
		
		// Final Result
		let result
		
		if (storeName) {
			
			// Cleanup the store name
			const storeName2 = _.camelCase(storeName.replace(/Store$/i, ''))
			
			// Find the store
			let store = stores[ storeName ] || stores[ storeName2 ]
			assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)
			
			// Check finder options for limit
			if (args[ 0 ] && _.isNumber(args[ 0 ].limit))
				args[ 0 ] = new FinderRequest(args[ 0 ])
			
			// Get the results
			result = store[ fnName ](...args)
			
			
		} else {
			result = await storePlugin.getDB(null)[ fnName ](...args)
			
		}
		
		// Ensure someone set a result
		assert(result, `Result can never be nil ${requestId}`)
		
		// If the result is a promise then wait
		if (_.isFunction(result.then))
			result = await result
		
		respond(socket, request, result)
	} catch (err) {
		log.error('Request failed', err, request)
		respond(socket, request, null, err)
	}
}


// Singleton
const databaseServerEntry = new DatabaseServerEntry()


/**
 * Export the singleton
 */
export default databaseServerEntry


/**
 * HMR - accept self - on dispose, close DB
 */


addHotDisposeHandler(module, () => {
	log.info('disposing database server')
	databaseServerEntry.kill()
	
	if (coordinator) {
		try {
			coordinator.stop()
		} catch (err) {
			log.warn(`HMR dispose, failed to stop TS coordinator`, err)
		}
	}
	
	if (storePlugin) {
		try {
			storePlugin.getDB(null).close()
		} catch (err) {
			log.warn(`HMR dispose, failed to stop TS coordinator`, err)
		}
	}
})

acceptHot(module, log)