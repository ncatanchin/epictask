
import 'reflect-metadata'
require('shared/LogConfig')
import 'shared/RendererLogging'
import 'shared/PromiseConfig'

import {Singleton, AutoWired, Container, Scope} from 'typescript-ioc'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'
import {Stores} from 'main/services/DBService'


const log = getLogger(__filename)

/**
 * Create PouchDB store options
 *
 * @returns {{filename: string}}
 */
function storeOptions() {
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

let storePlugin:PouchDBPlugin
let coordinator:TSCoordinator
let startPromise:Promise<any>

function getStore<T extends TSRepo<M>,M extends IModel>(repoClazz:{new():T}):T {
	return coordinator.getRepo(repoClazz)
}

async function start() {

	storePlugin = new PouchDBPlugin(this.storeOptions())
	/**
	 * init the coordinator
	 */
	coordinator = new TSCoordinator()
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

	await coordinator.start(...modelClazzes)

	log.info('Coordinator started, loading repos')

	const {RepoStore,IssueStore,AvailableRepoStore,CommentStore,
		LabelStore,ActivityStore,MilestoneStore,UserStore} = allModelsAndRepos



	Object.assign(this._stores, {
		repo:          getStore(RepoStore),
		issue:         getStore(IssueStore),
		availableRepo: getStore(AvailableRepoStore),
		milestone:     getStore(MilestoneStore),
		comment:       getStore(CommentStore),
		label:         getStore(LabelStore),
		activity:      getStore(ActivityStore),
		user:          getStore(UserStore)
	})

	log.info('Repos Loaded')


	// In DEBUG mode expose repos on global
	if (DEBUG) {
		_.assignGlobal({Repos:this._stores})
	}

	// Now bind repos to the IOC
	Container.bind(Stores)
		.provider({ get: () => this.stores })


}

/**
 * Start promise
 *
 * @type {Promise<any>}
 */
startPromise = start()

/**
 * Stop the database server
 */
function stop() {
	startPromise.cancel()

	if (!coordinator) return
	coordinator.stop()

	coordinator = null
}




/**
 * HMR - accept self - on dispose, close DB
 */
if (module.hot) {
	module.hot.accept()
	module.hot.dispose(() => {
		log.info('disposing database server')
		stop()

	})
}

/**
 * Exports
 */
export {}