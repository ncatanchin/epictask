import WorkerEntry from "shared/WorkerEntry"
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'
import {FinderRequest} from 'typestore'

import {Stores} from 'shared/Stores'
import {DatabaseEvents} from 'shared/db/DatabaseEvents'
import {IDatabaseRequest} from 'shared/db/DatabaseRequestResponse'
import {tempFilename,getUserDataFilename} from 'shared/util/Files'
import {ProcessNames} from "shared/ProcessType"
import * as uuid from 'node-uuid'

// Logger
const log = getLogger(__filename)

// IPC
const ipc = require('node-ipc')

let startDeferred:Promise.Resolver<any> = null

ipc.config.id = ProcessNames.DatabaseServer
ipc.config.retry = 1500
ipc.config.silent = true

// Database name and path
const
	dbName = Env.isTest ?
		`epictask-test-${uuid.v4()}` :
		`epictask-${Env.envName}`,
	dbPath = Env.isTest ?
		tempFilename(dbName + '.db') :
		getUserDataFilename(dbName + '.db')

log.info('DB Path:',dbPath)

/**
 * Create PouchDB store options
 *
 * @returns {{filename: string}}
 */
function storeOptions() {
	let opts = {filename: dbPath,cacheSize:32 * 1024 * 1024}
	if (Env.isDev && !Env.isTest) {
		opts = Object.assign({},opts, {
			replication: {
				to:   'http://127.0.0.1:5984/' + dbName,
				live:  true,
				retry: true
			}
		})
	}
	
	return opts
}

// PouchDB Plugin
let storePlugin:PouchDBPlugin

// TypeStore coordinator
let
	coordinator:TSCoordinator,
	stores:Stores = new Stores()

function getStore<T extends TSRepo<M>,M extends IModel>(repoClazz:{new():T}):T {
	return coordinator.getRepo(repoClazz)
}

export class DatabaseServerEntry extends WorkerEntry {
	
	constructor() {
		super(ProcessType.DatabaseServer)
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
		if (startDeferred)
			return startDeferred.promise
		
		startDeferred = Promise.defer()
		
		log.info('Starting Database Server')
		
		
		try {
			storePlugin = new PouchDBPlugin(storeOptions())
			coordinator = new TSCoordinator()
			await coordinator.init({}, storePlugin)
			
			const allModelsAndRepos = require('shared/models')
			const names = Object.keys(allModelsAndRepos)
			
			const modelClazzes = names
				.filter(name => {
					const val = allModelsAndRepos[name]
					return !_.endsWith(name, 'Store') && _.isFunction(val)
				})
				.map(name => {
					log.info(`Loading model class: ${name}`)
					return allModelsAndRepos[name]
				})
			
			await coordinator.start(...modelClazzes)
			
			log.info('Coordinator started, loading repos')
			
			
			const {
				RepoStore, IssueStore, AvailableRepoStore, CommentStore,
				LabelStore, ActivityStore, MilestoneStore, UserStore
			} = allModelsAndRepos
			
			log.info('Got all model stores')
			
			Object.assign(stores, {
				repo: getStore(RepoStore),
				issue: getStore(IssueStore),
				availableRepo: getStore(AvailableRepoStore),
				milestone: getStore(MilestoneStore),
				comment: getStore(CommentStore),
				label: getStore(LabelStore),
				activity: getStore(ActivityStore),
				user: getStore(UserStore)
			})
			
			log.info('Repos Loaded')
			
			
			// In DEBUG mode expose repos on global
			if (DEBUG) {
				assignGlobal({Stores: stores, db: storePlugin.db})
			}
			
			// Now bind repos to the IOC
			Container.bind(Stores)
				.provider({get: () => stores})
			
			log.info('Starting IPC Server')
			
			// Configure IPC Server
			ipc.serve(() => {
				ipc.server.on(DatabaseEvents.Request,async (request, socket) => {
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
		
		await startDeferred.promise.timeout(10000,"Database server took too long")
	}
	
	/**
	 * Stop the database server
	 */
	protected stop():Promise<any> {
		// Stop ipc server
		ipc.server && ipc.server.stop && ipc.server.stop()
		
		// Stop TypeStore Coordinator
		const coordinatorStopPromise = coordinator.stop()
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
function respond(socket,request:IDatabaseRequest,result,error:Error = null) {
	const response = {
		requestId:request.id,
		result,
		error
	}
	
	log.debug('Sending response',response)
	ipc.server.emit(socket,DatabaseEvents.Response,response)
	//ipcRenderer.send(DatabaseEvents.Response,{requestId:request.id,result,error})
}

/**
 * Execute a request
 *
 * @param socket
 * @param request
 */
async function executeRequest(socket,request:IDatabaseRequest) {
	try {
		const {id:requestId,store:storeName,fn:fnName,args} = request
		
		// Final Result
		let result
		
		if (storeName) {
			
			// Cleanup the store name
			const storeName2 = _.camelCase(storeName.replace(/Store$/i,''))
			
			// Find the store
			let store = stores[storeName] || stores[storeName2]
			assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)
			
			// Check finder options for limit
			if (args[0] && _.isNumber(args[0].limit))
				args[0] = new FinderRequest(args[0])
			
			// Get the results
			result = store[fnName](...args)
			
			
		} else {
			result = await storePlugin.db[fnName](...args)
			
		}
		
		// Ensure someone set a result
		assert(result,`Result can never be nil ${requestId}`)
		
		// If the result is a promise then wait
		if (_.isFunction(result.then))
			result = await result
		
		respond(socket,request,result)
	} catch (err) {
		log.error('Request failed',err,request)
		respond(socket, request,null,err)
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
if (module.hot) {
	
	module.hot.accept(() => log.info('Hot reloaded',__filename))
	module.hot.dispose(() => {
		log.info('disposing database server')
		databaseServerEntry.kill()
	})
}
