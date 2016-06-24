const log = getLogger(__filename)

//import 'lunr'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'
//import {AllLunrIndexes as Indexes} from './LunrIndex'
import {IRepos} from './DBRepos'
import {getUserDataFilename} from 'shared/util/Files'


/**
 * References to coordinator and plugins
 */
export let coordinator:TSCoordinator = null
export let storePlugin:PouchDBPlugin = null




/**
 * All global repositories
 */
export {IRepos}
export const Repos:IRepos = {} as any


// Started or not
let started = false

/**
 * Initialize the coordinator
 */
async function initialize() {

	// Create the store Plugin first
	const dbPath = getUserDataFilename('epictask.db')
	log.info('DB Path:',dbPath)

	/**
	 * Create the pouchdb data store
	 *
	 * - IN DEV REPLICATE TO LOCAL POUCH SERVER
	 *
	 * @type {PouchDBPlugin}
	 */
	function makeStorePlugin() {

		const pouchOpts = {filename: dbPath}
		if (Env.isDev) {
			//return (storePlugin = new PouchDBPlugin({filename:'http://127.0.0.1:5984/epictask-dev'}))
			_.assign(pouchOpts, {
				// replication: {
				// 	to:   'http://127.0.0.1:5984/epictask-dev-2',
				// 	live:  true,
				// 	retry: true
				// }
			})
		}

		return (storePlugin = new PouchDBPlugin(pouchOpts))
	}

	/**
	 * init the coordinator
	 */
	coordinator = new TSCoordinator()
	await coordinator.init({}, makeStorePlugin())


}

/**
 * Start the database and data services
 *
 * @returns {boolean}
 */
export async function start():Promise<boolean> {


	if (started)
		return Promise.resolve(true)

	// Mark
	started = true

	// Initialize coordinator
	await initialize()
	log.info('Coordinator initialized')

	// Start Coordinator
	// Types loaded for HMR
	let {
		Repo,
		RepoRepo,
		Milestone,
		MilestoneRepo,
		Issue,
		IssueRepo,
		Comment,
		CommentRepo,
		Label,
		LabelRepo,
		AvailableRepo,
		AvailableRepoRepo,
		Activity,
		ActivityRepo,
		User,
		UserRepo
	}  = require('shared/models')

	await coordinator.start(Repo,Issue,AvailableRepo,User,Milestone,Label,Comment,Activity)

	log.info('Coordinator started')

	Object.assign(Repos, {
		repo:          getRepo(RepoRepo),
		issue:         getRepo(IssueRepo),
		availableRepo: getRepo(AvailableRepoRepo),
		milestone:     getRepo(MilestoneRepo),
		comment:       getRepo(CommentRepo),
		label:         getRepo(LabelRepo),
		activity:      getRepo(ActivityRepo),
		user:          getRepo(UserRepo)
	})

	log.info('Repos Loaded')


	// In DEBUG mode expose repos on global
	if (DEBUG) {
		const g = global as any
		g.Repos = Repos
	}
	return true


}

/**
 * Stop the coordinator and shutdown plugins
 *
 * @returns {Promise<ICoordinator>|boolean}
 */
async function stop() {
	return await coordinator ? coordinator.stop() : true
}

/**
 * Get a repo instance for the local database
 *
 * @param repoClazz
 * @returns {T}
 */
export function getRepo<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
	return coordinator.getRepo(repoClazz)
}

//export {Indexes}

if (module.hot) {
	module.hot.accept(['shared/models','./DBRepos'],updates => {
		log.info(`HMR received updates to models`, updates, 'restarting')
		return start()
	})

}