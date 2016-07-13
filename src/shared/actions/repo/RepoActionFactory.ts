



import * as moment from 'moment'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import {Stores} from 'main/services/DBService'
import {ActionFactory, ActionReducer,Action} from 'typedux'
import {RepoKey} from 'shared/Constants'
import {RepoMessage, RepoState} from './RepoState'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from 'main/services/jobs/RepoSyncJob'
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import ActivityManagerService from 'main/services/ActivityManagerService'
import {ActivityType, Activity} from 'shared/models/Activity'
import {repoIdPredicate} from 'shared/actions/repo/RepoSelectors'

/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS


const uuid = require('node-uuid')



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
	 * get the last repo sync time
	 * @param repoId
	 */
	async getLastRepoSync(repoId:number) {
		return await Container.get(ActivityManagerService).findLastActivity(ActivityType.RepoSync,repoId)
	}

	/**
	 * Sync issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 * @param repoIds
	 * @param force
	 */
	@Action()
	syncRepo(repoIds:number|number[],force:boolean=false) {
		return async (dispatch,getState) => {
			const jobActions = this.jobActions
				.withDispatcher(dispatch,getState)

			if (!Array.isArray(repoIds))
				repoIds = [repoIds]

			for (let repoId of repoIds) {
				const
					availableRepo = await this.stores.availableRepo.findByRepoId(repoId),
					repo = await this.stores.repo.get(repoId),
					act = await this.getLastRepoSync(repoId)

				// Check the last execution time
				if (!force && act && moment().diff(act.timestamp,'minutes') < 5) {
					log.info(`Repo sync for ${repo.full_name} was rung less than 5 minutes ago (${moment(act.timestamp).fromNow()}), not syncing`)
					continue
				}

				log.info(`Triggering repo sync for ${repo.full_name}`)
				jobActions.triggerJob({
					id: `reposyncjob-${repo.id}`,
					name: "RepoSyncJob",
					args:{availableRepo,repo,force}
				})
			}

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


	@ActionReducer()
	clearSelectedRepos() {
		return (state:RepoState) => state.set('selectedRepoIds',[])
	}

	@ActionReducer()
	setRepoSelected(selectedRepoId:number,selected:boolean) {
		return (state:RepoState) => state.set(
			'selectedRepoIds',
			state.selectedRepoIds.filter(repoIdPredicate(selectedRepoId))
				.concat(selected ? [selectedRepoId] : [])
		)
	}

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
			actions.syncRepo([availRepo.repoId],true)
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
			//newAvailRepo = await stores.availableRepo.get(newAvailRepo.repoId)

			const dataActions:DataActionFactory = Container.get(DataActionFactory)
			dataActions.updateModels(AvailableRepo.$$clazz,{[`${availRepoId}`]:newAvailRepo})
			//actions.updateAvailableRepo(newAvailRepo)

			// Finally trigger a repo sync update
			if (enabled)
				this.syncRepo(newAvailRepo.repoId,true)

			log.info('Saved avail repo, setting enabled to',enabled)


			return true
		}
	}

}


export type RepoActionFactoryType = typeof RepoActionFactory

export default RepoActionFactory