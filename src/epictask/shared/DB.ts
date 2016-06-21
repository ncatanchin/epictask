import 'lunr'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {PouchDBPlugin} from 'typestore-plugin-pouchdb'
import {AllLunrIndexes as Indexes} from './LunrIndex'
import {IRepos} from './DBRepos'
import {getUserDataFilename} from './util/Files'

const log = getLogger(__filename)

/**
 * All global repositories
 */
export {IRepos}
export const Repos:IRepos = {} as any

/**
 * References to coordinator and plugins
 */
export let coordinator:TSCoordinator = null
//export let storePlugin:IndexedDBPlugin = null
export let storePlugin:PouchDBPlugin = null

// Started or not
let started = false

/**
 * Start the database and data services
 *
 * @returns {boolean}
 */
export function start():Promise<boolean> {


	// Actually types are reloaded here
	// enabling hot code replacement
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


	if (started)
		return Promise.resolve(true)

	// Mark
	started = true

	// Create the store Plugin first
	// storePlugin = new IndexedDBPlugin({
	// 	databaseName: `epictask-db${Env.isDev ? '-dev' : ''}`,
	// 	version: 1
	// })
	// const dbPath = getUserDataFilename('epictask.db')
	const dbPath = '/tmp/epictask-db2'
	log.info('DB Path:',dbPath)
	storePlugin = new PouchDBPlugin({
		filename: dbPath
		//databaseName: `epictask-db${Env.isDev ? '-dev' : ''}`,
		//version: 1
	})



	// Pass plugin(s) to the coordinator
	coordinator = new TSCoordinator()
	return coordinator.init({}, storePlugin)
		.then(() => {
			log.info('Coordinator initialized')

			const modelClazzes = [
				Repo,
				// Issue,

				// AvailableRepo,
				// User,
				// Milestone,
				//
				// Label,
				// Comment,
				// Activity
			]

			return coordinator.start(...modelClazzes)
		})
		.then(() => {
			log.info('Coordinator started')

			Object.assign(Repos, {
				repo:          getRepo(RepoRepo),
				issue:         getRepo(IssueRepo),

				// availableRepo: getRepo(AvailableRepoRepo),
				// milestone:     getRepo(MilestoneRepo),
				// comment:       getRepo(CommentRepo),
				// label:         getRepo(LabelRepo),
				// activity:      getRepo(ActivityRepo),
				// user:          getRepo(UserRepo)
			})

			log.info('Repos Loaded2')


			// In DEBUG mode expose repos on global
			if (DEBUG) {
				const g = global as any
				g.Repos = Repos
			}
			return true
		})
		.catch(err => {
			log.error('DB failed to init',err)

			throw err
		})

}

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

export {Indexes}

if (module.hot) {
	module.hot.accept(['shared/models','./DBRepos'],updates => {
		log.info(`HMR received updates to models`, updates, 'restarting')
		start()
	})

	module.hot.dispose(() => {
		log.info('DB being disposed of')
		return stop().then(() => log.info('Fully shutdown old coordinator'))
	})
}