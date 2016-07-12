




import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {AutoWired,Inject,Container} from 'typescript-ioc'
import {Stores} from 'main/services/DBService'
import {List} from 'immutable'
import {ActionFactory,Action} from 'typedux'
import {RepoKey,Dialogs} from "shared/Constants"
import {cloneObject} from 'shared/util/ObjectUtil'


import {SyncStatus,ISyncDetails} from 'shared/models/Sync'
import {Comment} from 'shared/models/Comment'
import {RepoMessage,RepoState} from './RepoState'
import {github} from 'shared'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {IssueStore,Issue} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from 'main/services/jobs/RepoSyncJob'
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {DataRequest} from 'shared/actions/data/DataState'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'


const uuid = require('node-uuid')

/**
 * Add transient properties to `Issue`
 * repo, milestones, collaborators
 *
 * @param issue
 * @param availableRepos
 * @returns {Issue}
 */
export async function fillIssue(issue:Issue,availableRepos:List<AvailableRepo>) {
	//issue = cloneObject(issue)

	let availRepo = availableRepos.find(availRepo => availRepo.repoId === issue.repoId)
	const stores:Stores = Container.get(Stores)

	if (!availRepo) {
		log.warn('Available repo not loaded', issue.repoId,'for issue',issue.title,'with id',issue.id,'going to load direct form db')

		const arStore = stores.availableRepo
		availRepo = await arStore.findByRepoId(issue.repoId)
		log.info(`Loaded available repo directly: ` + issue.repoId)
	}

	const filledAvailRepo = await stores.availableRepo.load(availRepo)

	return cloneObject(Object.assign({},issue, {
		repo: filledAvailRepo.repo,
		milestones: filledAvailRepo.milestones,
		collaborators: filledAvailRepo.collaborators
	}))

}


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@AutoWired
export class RepoActionFactory extends ActionFactory<RepoState,RepoMessage> {

	@Inject
	stores:Stores

	@Inject
	uiActions:UIActionFactory

	@Inject
	jobActions:JobActionFactory

	@Inject
	toaster:Toaster


	constructor() {
		super(RepoState)
	}

	leaf():string {
		return RepoKey;
	}


	/**
	 * Sync issues
	 * @param availRepo
	 * @returns {function(any, any): Promise<undefined>}
	 */
	@Action()
	syncRepo(repoId:number) {
		return async (dispatch,getState) => {
			const jobActions = this.jobActions
				.withDispatcher(dispatch,getState)

			const availableRepo = await this.stores.availableRepo.findByRepoId(repoId),
				repo = await this.stores.repo.get(repoId)

			jobActions.triggerJob({
				id: `reposyncjob-${repo.id}`,
				name: "RepoSyncJob",
				args:{availableRepo,repo}
			})
		}
	}



	@Action()
	loadAvailableRepos() {
		return (async (dispatch,getState) => {

			const stores = this.stores

			const availRepos = await stores.availableRepo.findAll()
			const availRepoMap = availRepos.reduce((map,nextAvailRepo) => {
				map[nextAvailRepo.repoId] = nextAvailRepo
				return map
			},{})

			const repoIds = availRepos.map(item => item.repoId)
			const dataActions = Container.get(DataActionFactory)

			const promises = [
				stores.repo.bulkGet(...repoIds)
					.then(models => models.reduce((modelMap,nextModel) => {
						modelMap[nextModel.id] = nextModel
						return modelMap
					},{}))
					.then(models => dataActions.updateModels(Repo.$$clazz,models)),
				stores.label.findByRepoId(...repoIds)
					.then(models => models.reduce((modelMap,nextModel) => {
						modelMap[nextModel.url] = nextModel
						return modelMap
					},{}))
					.then(models => dataActions.updateModels(Label.$$clazz,models)),
				stores.milestone.findByRepoId(...repoIds)
					.then(models => models.reduce((modelMap,nextModel) => {
						modelMap[nextModel.id] = nextModel
						return modelMap
					},{}))
					.then(models => dataActions.updateModels(Milestone.$$clazz,models))
			]


			await Promise.all(promises)
			dataActions.updateModels(AvailableRepo.$$clazz,availRepoMap)
			log.info('Loaded available repos and dependent models')

			return availRepos
		})
	}


	@Action()
	clearSelectedRepos() { }

	@Action()
	setRepoSelected(selectedAvailableRepo:AvailableRepo,selected:boolean) { }

	@Action()
	createAvailableRepo(repo:Repo) {
		return async(dispatch, getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			const
				repoStore = this.stores.repo,
				availRepoStore = this.stores.availableRepo,
				availRepo = new AvailableRepo({
					id: `available-repo-${repo.id}`,
					repoId: repo.id,
					enabled: true
				})


			const existingAvailRepo = await availRepoStore.get(availRepo.id)

			let savedRepo = await repoStore.get(repo.id)
			if (!savedRepo) {
				log.info('Create available repo request with a repo that isnt in the db - probably direct query result from GitHUb, adding')
				await repoStore.save(repo)
			}

			log.info('Saving new available repo as ',availRepo.repoId)
			await availRepoStore.save(availRepo)

			actions.loadAvailableRepos()

			await Promise.setImmediate()
			actions.syncRepo(availRepo.repoId)
		}
	}

	@Action()
	removeAvailableRepo(availRepoId:number) {
		return async(dispatch, getState) => {
			// const actions = this.withDispatcher(dispatch, getState)
			//
			//
			// const availRepoRepo = this.stores.availableRepo
			// await availRepoRepo.remove(availRepoId)
			//
			// const availRepos = actions.state.availableRepos
			// actions.setAvailableRepos(availRepos.filter(availRepo => availRepo.id !== availRepoId))

		}
	}


	/**
	 * Enabled and disable repos
	 *
	 * @param availRepoId
	 * @param enabled
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined|boolean>}
	 */
	@Action()
	setRepoEnabled(availRepoId:number,enabled:boolean) {
		return async (dispatch,getState) => {
			const stores = this.stores

			const actions = this.withDispatcher(dispatch,getState)
			const availRepo = await stores.availableRepo.findByRepoId(availRepoId)
			if (enabled === availRepo.enabled) {
				return
			}

			let newAvailRepo:AvailableRepo = Object.assign({},availRepo,{enabled})

			await stores.availableRepo.save(newAvailRepo)
			newAvailRepo = await stores.availableRepo.load(newAvailRepo)

			const dataActions:DataActionFactory = Container.get(DataActionFactory)
			dataActions.updateModels(AvailableRepo.$$clazz,{[`${availRepoId}`]:newAvailRepo})
			//actions.updateAvailableRepo(newAvailRepo)

			// Finally trigger a repo sync update
			if (enabled)
				this.syncRepo(newAvailRepo.repoId)

			log.info('Saved avail repo, setting enabled to',enabled)


			return true
		}
	}

}


export default RepoActionFactory