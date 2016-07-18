



import * as moment from 'moment'
import {chunkRemove} from 'main/services/DBService'
import {Benchmark} from 'shared/util/Benchmark'
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
import {Settings} from 'shared/Settings'
import {selectedIssueIdsSelector, editingIssueSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'

/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS


const uuid = require('node-uuid')

const Benchmarker = Benchmark('RepoActionFactory')

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

	get activityManager() {
		return Container.get(ActivityManagerService)
	}
	/**
	 * get the last repo sync time
	 *
	 * @param repoId
	 */
	getLastRepoSync(repoId:number):Promise<Activity> {
		return this.activityManager.findLastActivity(ActivityType.RepoSync,repoId)
	}

	/**
	 * Sync repo including issues, comments, milestones,
	 * labels, collaborators, etc, etc
	 *
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

	/**
	 * Sync user repos
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<AvailableRepo[]>}
	 */
	@Action()
	syncUserRepos() {
		return (dispatch,getState) => {
			log.info('Triggering user repo sync')

			const jobActions = Container.get(JobActionFactory)
			jobActions.triggerJob({
				id: `syncuserrepos`,
				name: "GetUserReposJob",
				args:{}
			})
		}
	}



	@Action()
	loadAvailableRepos() {
		return (async (dispatch,getState) => {

			const stores = this.stores

			let availRepos = await stores.availableRepo.findAll()
			availRepos = availRepos.filter(availRepo => !availRepo.deleted)

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
			dataActions.updateModels(AvailableRepo.$$clazz,availRepoMap,true)
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
				availRepoStore = this.stores.availableRepo

			let availRepo = new AvailableRepo({
				id: `available-repo-${repo.id}`,
				repoId: repo.id,
				enabled: true,
				deleted: false
			})





			let savedRepo = await repoStore.get(repo.id)
			if (!savedRepo) {
				log.info('Create available repo request with a repo that isnt in the db - probably direct query result from GitHUb, adding')
				await repoStore.save(repo)
			}


			log.info('Saving new available repo as ',availRepo.repoId)
			const existingAvailRepo = await availRepoStore.findByRepoId(repo.id)
			if (existingAvailRepo)
				availRepo = assign(existingAvailRepo,availRepo)

			await availRepoStore.save(availRepo)
			actions.loadAvailableRepos()
			actions.syncRepo([availRepo.repoId],true)




		}
	}

	@Benchmarker
	private async removeAvailableRepoAction(repoId,dispatch, getState) {
		const actions = this.withDispatcher(dispatch, getState)

		const {stores} = this
		const myUserId = Settings.user.id

		let availRepo = await stores.availableRepo.findByRepoId(repoId)
		availRepo.deleted = true
		availRepo = await stores.availableRepo.save(availRepo)

		// FIRST - get everything out of the state
		log.info(`Reloading avail repos`)
		await actions.loadAvailableRepos()

		log.info('Cleaning up issue selections')
		const issueActions:IssueActionFactory = Container.get(IssueActionFactory)
		issueActions.setSelectedIssueIds([])
		issueActions.clearAndLoadIssues()

		const editingIssue = editingIssueSelector(getState())
		if (_.get(editingIssue,'repoId') === repoId)
			issueActions.setEditingIssue(null)

		log.info(`Going to delay for a second then delete everything`)
		await Promise.delay(1000)


		const labelUrls = await stores.label.findUrlsByRepoId(repoId)
		const issueIds = await stores.issue.findIdsByRepoId(repoId)
		const commentIds = await stores.comment.findIdsByRepoId(repoId)
		const milestoneIds = await stores.milestone.findIdsByRepoId(repoId)
		let users = await stores.user.findByRepoId(repoId)
		users = users.filter(user => user.id !== myUserId)
		const updateUsers = users.filter(user => user.repoIds && user.repoIds.length > 1)
			.map(user => {
				_.remove(user.repoIds,(userRepoId) => repoId === parseInt(userRepoId,10))
				return user
			})

		const removeUsers = users.filter(user => !updateUsers.includes(user))

		log.info(`Going to remove
			availRepo: ${availRepo.id}
			labels: ${labelUrls.length}
			issues: ${issueIds.length}
			comments: ${commentIds.length}
			milestones: ${milestoneIds.length}
			users (update): ${updateUsers.length}
			users (update): ${removeUsers.length}
		`)

		log.info(`Removing avail repo`)

		const removePromises = [
			this.activityManager.removeByObjectId(repoId),
			chunkRemove([]
				.concat(commentIds)
				.concat(issueIds)
				.concat(labelUrls)
				.concat(milestoneIds)
				.concat(removeUsers.map(user => user.id))
				.concat([availRepo.id])),
			stores.user.bulkSave(...updateUsers),

		]



		await Promise.all(removePromises)

		log.info(`Avail repo removed ${repoId}`)





	}

	@Action()
	removeAvailableRepo(repoId:number) {

		return (dispatch, getState) => this.removeAvailableRepoAction(repoId,dispatch,getState)
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


			log.info('Saved avail repo, setting enabled to',enabled)
			return true
		}
	}

}


export default RepoActionFactory