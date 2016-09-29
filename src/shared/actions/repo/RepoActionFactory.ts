


import {List} from 'immutable'
import * as moment from 'moment'
import {chunkRemove} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import { Stores, getStores } from 'shared/Stores'
import {ActionFactory, ActionReducer,ActionThunk} from 'typedux'
import {RepoKey} from 'shared/Constants'
import {RepoMessage, RepoState} from './RepoState'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'

import Toaster from 'shared/Toaster'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import { repoIdPredicate, enabledRepoIdsSelector, availableReposSelector } from 'shared/actions/repo/RepoSelectors'
import {getSettings} from 'shared/settings/Settings'
import {editingIssueSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {User} from 'shared/models/User'
import {JobType} from "shared/actions/jobs/JobTypes"
import {Provided} from 'shared/util/ProxyProvided'
import { cloneObject } from "shared/util/ObjectUtil"
import JobDAO from "shared/actions/jobs/JobDAO"
import { RegisterActionFactory } from "shared/Registry"
import { pagedFinder } from "shared/util/RepoUtils"
import { getIssueActions, getJobActions } from  "shared/actions/ActionFactoryProvider"

const log = getLogger(__filename)
const uuid = require('node-uuid')
const Benchmarker = Benchmark('RepoActionFactory')


export interface ISyncChanges {
	repoId:number
	repoChanged?:boolean
	issueNumbersNew?:number[]
	issueNumbersChanged?:number[]
}

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

	
	@ActionThunk()
	onSyncChanges(changes:ISyncChanges) {
		return (dispatch,getState) => {
			log.debug(`Received repo sync changes`,changes)
			if (changes.repoChanged)
				this.loadAvailableRepos()
		}
	}
	
	/**
	 * Updated available repo resources
	 *
	 * @param availableRepos
	 * @returns {(state:RepoState)=>Map<K, V>}
	 */
	@ActionReducer()
	updateAvailableRepos(availableRepos:List<AvailableRepo>|AvailableRepo[]) {
		if (Array.isArray(availableRepos))
			availableRepos = List<AvailableRepo>(availableRepos)
		
		return (state:RepoState) => state.set('availableRepos',availableRepos)
			
	}
	
	async getLabelsByRepoIds(...repoIds):Promise<Label[]> {
		const mappedLabels = await Promise.all(repoIds
			.map(repoId => getStores().label.findByRepo(repoId)))
		
		return mappedLabels.reduce((allLabels,labels) => {
			allLabels.push(...labels)
			return allLabels
		},[]) as Label[]
	}
	
	async getMilestonesByRepoIds(...repoIds):Promise<Milestone[]> {
		const mappedMilestones = await Promise.all(repoIds
			.map(repoId => getStores().milestone.findByRepo(repoId)))
		
		return mappedMilestones.reduce((allMilestones,milestones) => {
			allMilestones.push(...milestones)
			return allMilestones
		},[]) as Milestone[]
	}
	
	
	async getReposWithValues(...repoIds) {
		const
			stores = Container.get(Stores),
			promises = [
				stores.availableRepo.findByRepoId(...repoIds),
				stores.repo.bulkGet(...repoIds),
				this.getLabelsByRepoIds(...repoIds),
				this.getMilestonesByRepoIds(...repoIds),
				this.getUsersByRepoId(...repoIds)
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
	
	/**
	 * Sync repo including issues, comments, milestones,
	 * labels, collaborators, etc, etc
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 * @param repoIds
	 * @param force
	 */
	@ActionThunk()
	syncRepo(repoIds:number|number[],force:boolean=false) {
		return async (dispatch,getState) => {
			
			const
				jobActions = getJobActions()

			if (!Array.isArray(repoIds))
				repoIds = [repoIds]
			
			
			for (let repoId of _.uniq(repoIds)) {
				const
					availableRepo = await this.stores.availableRepo.findByRepoId(repoId),
					repo = await this.stores.repo.get(repoId)

				// Create RepoSync Job
				log.debug(`Triggering repo sync for ${repo.full_name}`)
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
	@ActionThunk()
	syncUserRepos() {
		return (dispatch,getState) => {
			log.debug('Triggering user repo sync')
			
			JobDAO.create(JobType.GetUserRepos)
		}
	}

	@ActionThunk()
	syncAll() {
		return (dispatch,getState) => {
			
			this.syncUserRepos()
			this.syncRepo(
				enabledRepoIdsSelector(getState()).toArray(),
				true
			)
		}
		
	}

	getUsersByRepoId(...repoIds:number[]):Promise<List<User>> {
		return pagedFinder(User,50,getStores().user,(store,nextRequest) =>
			store.findByRepoId(nextRequest,...repoIds)
		)
	}
	
	/**
	 * Get all available repos and their dependent resources from backing store
	 */
	async getAllAvailableRepoResources() {
		const
			stores = Container.get(Stores)
		
		let
			availRepos = (await stores.availableRepo.findAll())
				.filter(availRepo => !availRepo.deleted),
			availRepoIds = availRepos.map(it => it.id)
		
		log.debug(`Got available repos `, availRepos,availRepoIds)
		
		// Filter Deleted
		const
			repoIds = availRepos.map(item => item.id),
			milestones = [],
			labels = [],
			assignees = [],
			
			// All Promises
			promises = [
				
				// Repos
				stores.repo.bulkGet(...repoIds)
					.then(models => {
						availRepos.forEach(it =>
							it.repo = models.find(repo => repo.id ===  it.id))
					}),
				
				// Users/Assignees/Collaborators
				this.getUsersByRepoId(...repoIds).then(modelList => {
					const
						models = modelList.toArray()
					
					assignees.push(...models)
					availRepos.forEach(it =>
						(it.collaborators = it.collaborators || [])
							.push(...models.filter(user => user.repoIds.includes(it.repoId))))
				})
			
			
			].concat(
				
				// Labels
				repoIds.map(repoId =>
					stores.label.findByRepo(repoId)
						.then(models => {
							labels.push(...models)
							availRepos.forEach(it =>
								it.labels = models.filter(label =>  label.repoId ===  it.repoId))
						}),
				),
				
				// Milestones
				repoIds.map(repoId =>
					stores.milestone.findByRepo(repoId)
						.then(models => {
							milestones.push(...models)
							availRepos.forEach(it =>
								it.milestones = models.filter(milestone =>  milestone.repoId ===  it.repoId))
						})
				)
			)
		
		
		
		
		await Promise.all(promises)
		
		return List<AvailableRepo>(availRepos)
	}
	
	/**
	 * Reload all available repo resources
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	loadAvailableRepos(syncChanges:ISyncChanges = null) {
		return async (dispatch,getState) => {
			log.debug(`Getting available repos`)
			
			const
				availableRepos = await this.getAllAvailableRepoResources()
			
			log.debug(`Got all avail repo parts`,availableRepos)
			this.updateAvailableRepos(availableRepos)
			
			if (syncChanges) {
				log.debug(`Now checking issue sync changes`,syncChanges)
				
				getIssueActions().onSyncChanges(syncChanges)
			}
			
		}
	}


	@ActionReducer()
	clearSelectedRepos() {
		return (state:RepoState) => state.set('selectedRepoIds',[])
	}
	
	/**
	 * Select a repo in the repo list
	 *
	 * @param selectedRepoId
	 * @param selected
	 */
	@ActionReducer()
	setRepoSelected(selectedRepoId:number,selected:boolean) {
		return (state:RepoState) => state.set(
			'selectedRepoIds',
			state
				.selectedRepoIds.filter(repoIdPredicate(selectedRepoId))
				.concat(selected ? [selectedRepoId] : [])
		)
	}
	
	/**
	 * Mark a repo as an 'AvailableRepo'
	 * @param repo
	 */
	@ActionThunk()
	createAvailableRepo(repo:Repo) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				repoStore = this.stores.repo,
				availRepoStore = this.stores.availableRepo

			let availRepo:AvailableRepo = new AvailableRepo({
				id: repo.id,
				repoId: repo.id,
				enabled: true,
				deleted: false
			})

			let
				savedRepo = await repoStore.get(repo.id)
			
			if (!savedRepo) {
				log.debug(`Create available repo request with a repo that isn't in the db - probably direct query result from GitHUb, adding`)
				await repoStore.save(repo)
			}
			
			const
				existingAvailRepo:AvailableRepo = await availRepoStore.get(repo.id)
			
			log.debug('Saving new available repo as ',availRepo.repoId,'existing',existingAvailRepo && JSON.stringify(existingAvailRepo,null,4))
			if (existingAvailRepo)
				availRepo = assign(existingAvailRepo,availRepo)
		
			await availRepoStore.save(availRepo)
			actions.loadAvailableRepos()
			actions.syncRepo([availRepo.repoId],true)
			
		}
	}
	
	/**
	 * Remove an AvailableRepo from the system
	 *
	 * @param availRepoId
	 * @param dispatch
	 * @param getState
	 */
	@Benchmarker
	private async removeAvailableRepoAction(availRepoId,dispatch, getState) {
		
		const
			actions = this.withDispatcher(dispatch, getState),
			{stores} = this,
			myUserId = _.get(getSettings(),'user.id')

		// Get the repo
		let
			availRepo = await stores.availableRepo.get(availRepoId)
		
		assert(availRepo,`Available repo not found for id ${availRepoId}`)
		const
			{repoId} = availRepo
		
		availRepo.deleted = true
		availRepo = await stores.availableRepo.save(availRepo)

		// FIRST - get everything out of the state
		log.debug(`Reloading avail repos`)
		await actions.loadAvailableRepos()

		log.debug('Cleaning up issue selections')
		const
			issueActions:IssueActionFactory = Container.get(IssueActionFactory),
			editingIssue = editingIssueSelector(getState())
		
		issueActions.setSelectedIssueIds([])
		// issueActions.clearAndLoadIssues()
		
		if (_.get(editingIssue,'repoId') === repoId)
			issueActions.setEditingIssue(null)

		log.debug(`Going to delay for a second then delete everything`)
		await Promise.delay(1000)


		// Retrieve every entity for the repo
		const
			labelIds = await stores.label.findIdsByRepo(repoId),
			issueIds = await stores.issue.findIdsByIssuePrefix(null,repoId),
			commentIds = await stores.comment.findIdsByRepoId(null,repoId),
			milestoneIds = await stores.milestone.findIdsByRepo(repoId),
			users = (await stores.user.findByRepoId(null,repoId))
				.filter(user => user.id !== myUserId),
			
			removeUsers = users
				.filter(user => user.repoIds && user.repoIds.length === 1)
				.map(user => {
					_.remove(user.repoIds,(userRepoId) => repoId === userRepoId)
					return user
				})

		log.debug(`Going to remove
			availRepo: ${availRepo.id}
			labels: ${labelIds.length}
			issues: ${issueIds.length}
			comments: ${commentIds.length}
			milestones: ${milestoneIds.length}
			users (update): ${removeUsers.length}
		`)

		log.debug(`Removing avail repo`)

		const
			// Concat all ids to remove
			removeUserIds = removeUsers.map(user => user.id),
			
			// Create a promise to remove everything
			removePromise = Promise.all([
				chunkRemove(commentIds,stores.comment),
				chunkRemove(labelIds,stores.label),
				chunkRemove(milestoneIds,stores.milestone),
				chunkRemove(issueIds,stores.issue),
				chunkRemove(removeUserIds,stores.user),
				stores.availableRepo.remove(availRepoId)
				
			])


		// Wait for the all-clear
		await removePromise

		log.debug(`Avail repo removed ${repoId}`)

	}
	
	/**
	 * Remove an available repo
	 *
	 * @param availRepoId
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	removeAvailableRepo(availRepoId:number) {
		return (dispatch, getState) => this.removeAvailableRepoAction(availRepoId,dispatch,getState)
	}


	/**
	 * Enabled and disable repos
	 *
	 * @param availRepoId
	 * @param enabled
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined|boolean>}
	 */
	@ActionThunk()
	setRepoEnabled(availRepoId,enabled:boolean) {
		return async (dispatch,getState) => {
			const
				stores = this.stores,
				availRepo = await stores.availableRepo.get(availRepoId)
			
			log.debug(`Setting available repo ${availRepo.id} to enabled ${enabled}`,availRepo,enabled)
			if (enabled === availRepo.enabled) {
				log.warn(`No change in avail repo enabled state`,availRepo,enabled)
				return
			}
			
			availRepo.enabled = enabled
			await stores.availableRepo.save(availRepo)
			
			
			let
				availableRepos = availableReposSelector(getState())
				 
					
				
					
			
			this.updateAvailableRepos(availableRepos.update(
				availableRepos.findIndex(it => it.id === availRepoId),
				(availableRepo) => cloneObject(availableRepo,{enabled})
			))
			log.debug('Saved avail repo, setting enabled to',enabled)
			
		}
	}

}


export default RepoActionFactory