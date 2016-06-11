import 'lunr'
import {Coordinator as TSCoordinator,Repo as TSRepo, IModel} from 'typestore'
import {IndexedDBPlugin} from 'typestore-plugin-indexeddb'
import {AllLunrIndexes as Indexes} from './LunrIndex'

import {
	Repo,
	RepoRepo,
	User,
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
	ActivityRepo
}  from 'shared/models'

export interface IRepos {
	issue:IssueRepo
	repo: RepoRepo
	availableRepo: AvailableRepoRepo
	milestone: MilestoneRepo
	comment: CommentRepo
	label: LabelRepo
	activity: ActivityRepo
}

export const Repos:IRepos = {} as any

export let coordinator:TSCoordinator = null
export let storePlugin:IndexedDBPlugin = null


let started = false

/**
 * Start the database and data services
 *
 * @returns {boolean}
 */
export async function start() {
	if (started)
		return true

	// Mark
	started = true

	// Create the store Plugin first
	storePlugin = new IndexedDBPlugin({
		databaseName: `epictask-db${Env.isDev ? '-dev' : ''}`,
		version: 1
	})


	// Pass plugin(s) to the coordinator
	coordinator = new TSCoordinator()
	await coordinator.init({},storePlugin)

	const modelClazzes = [
		Repo,
		AvailableRepo,
		User,
		Milestone,
		Issue,
		Label,
		Comment,
		Activity
	]

	await coordinator.start(...modelClazzes)

	Object.assign(Repos,{
		issue: getRepo(IssueRepo),
		repo: getRepo(RepoRepo),
		availableRepo: getRepo(AvailableRepoRepo),
		milestone: getRepo(MilestoneRepo),
		comment: getRepo(CommentRepo),
		label: getRepo(LabelRepo),
		activity: getRepo(ActivityRepo)
	})

	return true
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

