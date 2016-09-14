



import * as moment from 'moment'
import {chunkRemove} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import {Stores} from 'shared/Stores'
import {ActionFactory, ActionReducer,Action} from 'typedux'
import {RepoKey} from 'shared/Constants'
import {RepoMessage, RepoState} from './RepoState'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'

import Toaster from 'shared/Toaster'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import ActivityManagerService from 'shared/services/ActivityManagerService'
import {ActivityType, Activity} from 'shared/models/Activity'
import { repoIdPredicate, enabledRepoIdsSelector } from 'shared/actions/repo/RepoSelectors'
import {getSettings} from 'shared/Settings'
import {editingIssueSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {User} from 'shared/models/User'
import {JobType} from "shared/actions/jobs/JobTypes"
import {Provided} from 'shared/util/ProxyProvided'
import { cloneObject } from "shared/util"
import JobDAO from "shared/actions/jobs/JobDAO"
import { RegisterActionFactory } from "shared/Registry"

const log = getLogger(__filename)
const uuid = require('node-uuid')
const Benchmarker = Benchmark('RepoActionFactory')

/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@RegisterActionFactory
@Provided
export class RepoActionFactory extends ActionFactory<RepoState,RepoMessage> {
	
	static leaf = RepoKey
	
	stores:Stores

	jobActions:JobActionFactory

	toaster:Toaster


	constructor() {
		super(RepoState)
		
		this.stores = Container.get(Stores)
		this.jobActions = Container.get(JobActionFactory)
		this.toaster = Container.get(Toaster)
	}

	leaf():string {
		return RepoKey;
	}

	get activityManager() {
		return Container.get(ActivityManagerService)
	}
	
	
	
	
	@ActionReducer()
	updateAvailableRepos(...availableRepos:AvailableRepo[]) {
		return (state:RepoState) => state
			.set('availableRepoIds',availableRepos.map(it => it.id))
			.set('enabledRepoIds',availableRepos.filter(it => it.enabled).map(it => it.repoId))
	}
	
	async getAvailableRepos(...ids:any[]) {
		const
			stores = Container.get(Stores),
			availRepos = await stores.availableRepo.bulkGet(...ids),
			repoIds = availRepos.map(item => item.repoId)
		
		const
			promises = [
				stores.repo.bulkGet(...repoIds)
					.then(models => {
						availRepos.forEach(it =>
							it.repo = models.find(repo => repo.id ===  it.repoId))
					}),
	
				stores.label.findByRepoId(...repoIds)
					.then(models => {
						availRepos.forEach(it =>
							it.labels = models.filter(label =>  label.repoId ===  it.repoId))
					}),
	
				stores.milestone.findByRepoId(...repoIds)
					.then(models => {
						availRepos.forEach(it =>
							it.milestones = models.filter(milestone =>  milestone.repoId ===  it.repoId))
					}),
	
				stores.user.findByRepoId(...repoIds)
					.then(models => {
						availRepos.forEach(it =>
							it.collaborators = models.filter(user => user.repoIds.includes(it.repoId)))
					})

		]
		
		
		await Promise.all(promises)
		
		return availRepos
	}
	
	
	async getReposWithValues(...repoIds) {
		
		
		const
			stores = Container.get(Stores),
			promises = [
				stores.availableRepo.findByRepoId(...repoIds),
				stores.repo.bulkGet(...repoIds),
				stores.label.findByRepoId(...repoIds),
				stores.milestone.findByRepoId(...repoIds),
				stores.user.findByRepoId(...repoIds)
			],
			[availableRepos,repos,labels,milestones,collaborators]:[AvailableRepo[],Repo[],Label[],Milestone[],User[]] =
				await Promise.all(promises) as any
		
		return {
			availableRepos: availableRepos.map(availRepo => cloneObject(availRepo,{
				repo: repos.find(it => it.id === availRepo.repoId),
				labels: labels.filter(it => it.repoId === availRepo.repoId),
				milestones: milestones.filter(it => it.repoId === availRepo.repoId),
				collaborators: collaborators.filter(it => it.repoIds.includes(availRepo.repoId))
			})),
			repos,
			labels,
			milestones,
			collaborators
		}
	}
	
	async internalLoadAvailableRepoIds() {
		const stores = Container.get(Stores)
		
		let availRepos = await stores.availableRepo.findAll()
		log.info(`Loaded avail repos`,JSON.stringify(availRepos,null,4))
		// Filter Deleted
		availRepos = availRepos.filter(availRepo => !availRepo.deleted)
		
		this.updateAvailableRepos(...availRepos)
		return availRepos
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
			
			const
				jobActions = this.jobActions
					.withDispatcher(dispatch,getState)

			if (!Array.isArray(repoIds))
				repoIds = [repoIds]

			for (let repoId of _.uniq(repoIds)) {
				const
					availableRepo = await this.stores.availableRepo.findByRepoId(repoId),
					repo = await this.stores.repo.get(repoId),
					act = await this.getLastRepoSync(repoId)

				// Check the last execution time
				if (!force && act && moment().diff(act.timestamp,'minutes') < 5) {
					log.info(`Repo sync for ${repo.full_name} was rung less than 5 minutes ago (${moment(act.timestamp).fromNow()}), not syncing`)
					continue
				}

				// Create RepoSync Job
				log.info(`Triggering repo sync for ${repo.full_name}`)
				JobDAO.create(JobType.RepoSync,null,{
					availableRepo,
					repo,
					force
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
			
			JobDAO.create(JobType.GetUserRepos)
		}
	}

	@Action()
	syncAll() {
		return (dispatch,getState) => {
			
			this.syncUserRepos()
			this.syncRepo(
				enabledRepoIdsSelector(getState()),
				true
			)
		}
		
	}

	@Action()
	loadAvailableRepoIds() {
		return (dispatch,getState) => {
			log.info(`Getting available repos`)
			return this.internalLoadAvailableRepoIds()
		}
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

			let availRepo:AvailableRepo = new AvailableRepo({
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


			
			const existingAvailRepo:AvailableRepo = await availRepoStore.findByRepoId(repo.id)[0]
			log.info('Saving new available repo as ',availRepo.repoId,'existing',existingAvailRepo && JSON.stringify(existingAvailRepo,null,4))
			if (existingAvailRepo)
				availRepo = assign(existingAvailRepo,availRepo)
		
			await availRepoStore.save(availRepo)
			actions.loadAvailableRepoIds()
			actions.syncRepo([availRepo.repoId],true)
			
		}
	}

	@Benchmarker
	private async removeAvailableRepoAction(repoId,dispatch, getState) {
		
		const
			actions = this.withDispatcher(dispatch, getState),
			{stores} = this,
			myUserId = _.get(getSettings(),'user.id')

		// Get the repo
		let availRepo = await stores.availableRepo.findByRepoId(repoId)[0]
		availRepo.deleted = true
		availRepo = await stores.availableRepo.save(availRepo)

		// FIRST - get everything out of the state
		log.info(`Reloading avail repos`)
		await actions.loadAvailableRepoIds()

		log.info('Cleaning up issue selections')
		const
			issueActions:IssueActionFactory = Container.get(IssueActionFactory),
			editingIssue = editingIssueSelector(getState())
		
		issueActions.setSelectedIssueIds([])
		issueActions.clearAndLoadIssues()
		
		if (_.get(editingIssue,'repoId') === repoId)
			issueActions.setEditingIssue(null)

		log.info(`Going to delay for a second then delete everything`)
		await Promise.delay(1000)


		// Retrieve every entity for the repo
		const
			labelUrls = await stores.label.findUrlsByRepoId(repoId),
			issueIds = await stores.issue.findIdsByRepoId(repoId),
			commentIds = await stores.comment.findIdsByRepoId(repoId),
			milestoneIds = await stores.milestone.findIdsByRepoId(repoId),
			users = (await stores.user.findByRepoId(repoId))
				.filter(user => user.id !== myUserId),
			
			removeUsers = users
				.filter(user => user.repoIds && user.repoIds.length === 1)
				.map(user => {
					_.remove(user.repoIds,(userRepoId) => repoId === userRepoId)
					return user
				})

		log.info(`Going to remove
			availRepo: ${availRepo.id}
			labels: ${labelUrls.length}
			issues: ${issueIds.length}
			comments: ${commentIds.length}
			milestones: ${milestoneIds.length}
			users (update): ${removeUsers.length}
		`)

		log.info(`Removing avail repo`)

		const
			// Concat all ids to remove
			allRemoveIds = []
				.concat(commentIds)
				.concat(issueIds)
				.concat(labelUrls)
				.concat(milestoneIds)
				.concat(removeUsers.map(user => user.id))
				.concat([availRepo.id]),
			
			// Create a promise to remove everything
			removePromise = Promise.all([
				this.activityManager.removeByObjectId(repoId),
				chunkRemove(allRemoveIds)
			])


		// Wait for the all-clear
		await removePromise

		log.info(`Avail repo removed ${repoId}`)

	}
	
	/**
	 * Remove an available repo
	 *
	 * @param repoId
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
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
	setRepoEnabled(availRepoId,enabled:boolean) {
		return async (dispatch,getState) => {
			const
				stores = this.stores,
				availRepo = await stores.availableRepo.get(availRepoId)
			
			if (enabled === availRepo.enabled) {
				return
			}

			let newAvailRepo:AvailableRepo = Object.assign({},availRepo,{enabled})

			await stores.availableRepo.save(newAvailRepo)
			//newAvailRepo = await stores.availableRepo.get(newAvailRepo.repoId)
			
			// TODO: Notify update
			// const dataActions:DataActionFactory = Container.get(DataActionFactory)
			// dataActions.updateModels(AvailableRepo.$$clazz,{[`${availRepoId}`]:newAvailRepo})
			//actions.updateAvailableRepo(newAvailRepo)

			await this.internalLoadAvailableRepoIds()
			log.info('Saved avail repo, setting enabled to',enabled)
			return true
		}
	}

}


export default RepoActionFactory