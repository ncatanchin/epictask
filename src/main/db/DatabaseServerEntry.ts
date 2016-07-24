
import 'reflect-metadata'
import 'shared/LogConfig'
import 'shared/RendererLogging'
import 'shared/Globals'
import 'shared/PromiseConfig'

import Electron = require('electron')
import {Container, Scope} from 'typescript-ioc'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'
import {Stores} from 'shared/Stores'
import {DatabaseEvents} from 'main/db/DatabaseEvents'
import {IDatabaseRequest} from 'main/db/DatabaseRequestResponse'
import {getUserDataFilename} from 'shared/util/Files'
import {FinderRequest} from 'typestore'

// Logger
const log = getLogger(__filename)


const {ipcRenderer} = Electron

// Database name and path
const dbName = `epictask-${Env.envName}-new`
const dbPath = getUserDataFilename(dbName + '.db')

log.info('DB Path:',dbPath)

/**
 * Create PouchDB store options
 *
 * @returns {{filename: string}}
 */
function storeOptions() {
	let opts = {filename: dbPath,cacheSize:32 * 1024 * 1024}
	if (Env.isDev) {
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
let coordinator:TSCoordinator
let startPromise:Promise<any>
let stores:Stores = new Stores()

function getStore<T extends TSRepo<M>,M extends IModel>(repoClazz:{new():T}):T {
	return coordinator.getRepo(repoClazz)
}

async function start() {

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
			_.assignGlobal({Stores: stores,db:storePlugin.db})
		}

		// Now bind repos to the IOC
		Container.bind(Stores)
			.provider({get: () => stores})

		log.info('DatabaseServer is ready - notifying window')
		ipcRenderer.send(DatabaseEvents.Ready)

	} catch (err) {

		log.error('start failed',err)
		throw err
	}
}

/**
 * Send response to request
 *
 * @param request
 * @param result
 * @param error
 */
function respond(request:IDatabaseRequest,result,error:Error = null) {
	log.debug('Sending response',result,error)
	ipcRenderer.send(DatabaseEvents.Response,{requestId:request.id,result,error})
}

/**
 * Execute a request
 *
 * @param request
 */
async function executeRequest(request:IDatabaseRequest) {
	try {
		const {id:requestId,store:storeName,fn:fnName,args} = request

		let result

		if (storeName) {

			const storeName2 = _.camelCase(storeName.replace(/Store$/i,''))

			let store = stores[storeName] || stores[storeName2]
			assert(store, `Unable to find store for ${storeName} (requestId: ${requestId})`)


			if (args[0] && _.isNumber(args[0].limit))
				args[0] = new FinderRequest(args[0])

			result = store[fnName](...args)


			// If its a promise then wait - and it should be a promise



		} else {
			result = await storePlugin.db[fnName](...args)

		}

		assert(result,`Result can never be nil ${requestId}`)
		if (_.isFunction(result.then))
			result = await result

		respond(request,result)
	} catch (err) {
		log.error('Request failed',err,request)
		respond(request,null,err)
	}
}

function onRequest(event,request:IDatabaseRequest) {


	log.debug(`Processing database request`,request)

	return executeRequest(request)

}

// Register IPC events
ipcRenderer.on(DatabaseEvents.Request,onRequest)


/**
 * Start promise
 *
 * @type {Promise<any>}
 */
log.info('Calling start')
startPromise = start()

/**
 * Stop the database server
 */
function stop() {
	ipcRenderer.removeListener(DatabaseEvents.Request,onRequest)
	startPromise.cancel()

	if (coordinator) {
		coordinator.stop()
		coordinator = null
	}
}





/**
 * HMR - accept self - on dispose, close DB
 */
if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing database server')
		stop()

	})

	module.hot.accept()
}

/**
 * Exports
 */
export {}