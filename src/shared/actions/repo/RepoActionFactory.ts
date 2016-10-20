

import {FinderRequest} from 'typestore'
import {List} from 'immutable'
import {chunkRemove} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import { getStores } from 'shared/Stores'
import {ActionFactory, ActionReducer,ActionThunk} from 'typedux'
import {RepoKey} from 'shared/Constants'
import {RepoMessage, RepoState} from './RepoState'

// import {Repo} from 'shared/models/Repo'
// import {AvailableRepo} from 'shared/models/AvailableRepo'
// import {Label} from 'shared/models/Label'
// import {Milestone} from 'shared/models/Milestone'

import {
	Milestone, Label, AvailableRepo, Repo, LoadStatus, Issue, IssueStore, makeIssueId,
	Comment,CommentStore, makeCommentId
} from 'shared/models'

import { repoIdPredicate, enabledRepoIdsSelector, availableReposSelector } from 'shared/actions/repo/RepoSelectors'
import {getSettings} from 'shared/settings/Settings'
import {User} from 'shared/models/User'
import {JobType} from "shared/actions/jobs/JobTypes"
import {Provided} from 'shared/util/ProxyProvided'
import { getValue, isNil, nilFilter, cloneObject, cloneObjectShallow } from "shared/util"
import JobDAO from "shared/actions/jobs/JobDAO"
import { RegisterActionFactory } from "shared/Registry"
import { pagedFinder } from "shared/util/RepoUtils"
import { getIssueActions, getJobActions } from  "shared/actions/ActionFactoryProvider"
import { ISyncChanges } from "shared/models"
import GithubSyncStatus from 'shared/github/GithubSyncStatus'

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
	
	
	constructor() {
		super(RepoState)
	}
	
	/**
	 * Supported leaf = RepoState
	 *
	 * @returns {string}
	 */
	leaf():string {
		return RepoKey;
	}
	
	@ActionReducer()
	patchAvailableRepos(patch:any,availableRepos:List<AvailableRepo>|AvailableRepo[]) {
		return (state:RepoState) => {
			
			let
				newAvailRepos = state.availableRepos
			
			availableRepos = (Array.isArray(availableRepos) ?
				availableRepos :
				availableRepos.toArray()) as AvailableRepo[]
			
			for (let availRepo of availableRepos) {
				const
					index = newAvailRepos.findIndex(it => it.id === availRepo.id),
					existingAvailRepo = index > -1 && newAvailRepos.get(index)
				
				if (!existingAvailRepo) {
					log.warn(`Tried to patch a repo that is not in the state`, availRepo)
					continue
				}
				
				availRepo = assign(_.clone(existingAvailRepo),patch)
				
				newAvailRepos = newAvailRepos.set(index,availRepo)
			}
			
			
			return state.set('availableRepos',newAvailRepos)
			
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
		return (state:RepoState) => {
			
			let
				newAvailRepos = state.availableRepos
			
			availableRepos = (Array.isArray(availableRepos) ?
				availableRepos :
				availableRepos.toArray()) as AvailableRepo[]
			
			for (let availRepo of availableRepos) {
				const
					index = newAvailRepos.findIndex(it => it.id === availRepo.id),
					existingAvailRepo = index > -1 && newAvailRepos.get(index)
				
				
				availRepo = assign(_.clone(existingAvailRepo || availRepo),availRepo)
				
				newAvailRepos = index === -1 ?
					newAvailRepos.push(availRepo) :
					newAvailRepos.set(index,availRepo)
			}
			
			
			return state.set('availableRepos',newAvailRepos)
			
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

			if (!Array.isArray(repoIds))
				repoIds = [repoIds]
			
			for (let repoId of _.uniq(repoIds)) {
				const
					availableRepo = await getStores().availableRepo.findByRepoId(repoId),
					repo = await getStores().repo.get(repoId)

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
	
	/**
	 * Sync everything / enabled repos & current user repos list
	 */
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
	 * Patch available repo
	 */
	
	private patchAvailableRepo(state:RepoState,repoId:number,field:string,value:any) {
		let
			{availableRepos} = state,
			index = availableRepos.findIndex(it => it.id === repoId),
			availableRepo = index !== -1 && cloneObjectShallow(availableRepos.get(index))
		
		if (!availableRepo) {
			log.error(`Can not update ${field} on state, no repo found with id ${repoId}`)
			return state
		}
		
		availableRepo[field] = value
		
		// ON NEXT TICK UPDATE ISSUES
		setImmediate(() => {
			getIssueActions()
				.refillResourcesForRepo(
					availableRepo,
					field === 'milestones' ?
						'milestone' :
						'labels'
				)
		})
		
		return state.set('availableRepos', availableRepos.set(index,availableRepo))
	}
	
	
	/**
	 * Update milestones on state
	 *
	 * @param repoId
	 * @param milestones
	 */
	@ActionReducer()
	updateMilestones(repoId:number,...milestones:Milestone[]) {
		return (state:RepoState) => this.patchAvailableRepo(state,repoId,'milestones',milestones)
	}
	
	/**
	 * Update labels on state
	 *
	 * @param repoId
	 * @param labels
	 */
	@ActionReducer()
	updateLabels(repoId:number,...labels:Label[]) {
		return (state:RepoState) => this.patchAvailableRepo(state,repoId,'labels',labels)
	}
	
	/**
	 * Update assignees on state
	 *
	 * @param repoId
	 * @param collaborators
	 */
	@ActionReducer()
	updateCollaborators(repoId:number,...collaborators:User[]) {
		return (state:RepoState) => {
			const
				availableRepo = state.availableRepos.find(it => it.id === repoId)
			
			if (!availableRepo) {
				log.error(`Unable to find repo ${repoId} on state - can not update assignees`)
				return state
			}
			
			collaborators = !availableRepo.collaborators ?
				collaborators :
				availableRepo
					.collaborators
					.filter(it => !collaborators.find(newCollab => newCollab.id === it.id))
					.concat(collaborators)
			
			return this.patchAvailableRepo(state,repoId,'collaborators',collaborators)
		}
	}
	
	/**
	 * Check if a repo has already been loaded into the state
	 *
	 * @param availRepo
	 * @returns {boolean}
	 */
	private repoInState(availRepo) {
		const
			{availableRepos} = this.state,
			currentRepo = availableRepos && availableRepos
				.find(it =>
					it.id === availRepo.id &&
					it.repoLoadStatus &&
					it.repoLoadStatus > LoadStatus.NotLoaded)
		return !isNil(currentRepo)
			
	}
	
	/**
	 * Load all available repo resources
	 */
	@ActionThunk()
	loadAvailableRepos(prepareOnBoot = false) {
		return async (dispatch,getState) => {
			log.debug(`Getting available repos`)
			
			const
				stores = getStores(),
				
				// UPDATE LOAD STATUS AND STEP OVER
				updateLoadStatuses = async (availReposToUpdate,repoLoadStatus:LoadStatus,issuesLoadStatus:LoadStatus) => {
					let
						updatedAvailRepos = availReposToUpdate.map(it => assign(_.clone(it),{
							repoLoadStatus: LoadStatus.Loading,
							issuesLoadStatus: LoadStatus.NotLoaded
						}))
					
					this.updateAvailableRepos(updatedAvailRepos)
					
					// QUICK DELAY TO ALLOW UI UPDATE
					await Promise.setImmediate()
					
					if (List.isList(updatedAvailRepos))
						updatedAvailRepos = updatedAvailRepos.toArray()
					
					return updatedAvailRepos as AvailableRepo[]
				}
			
			
			
			// IF THIS IS THE BOOT REQUEST
			if (prepareOnBoot && getValue(() => this.state.availableRepos.size,0)) {
				await updateLoadStatuses(this.state.availableRepos,LoadStatus.NotLoaded, LoadStatus.NotLoaded)
			}
			
			// NOW QUERY THE DB AND GET TO WORK
			let
				availRepos = (await stores.availableRepo.findAll())
					// FILTER DELETED && ALREADY IN STATE
					.filter(availRepo => !availRepo.deleted && !this.repoInState(availRepo)),
				
				availRepoIds = availRepos.map(it => it.id)
			
			// IF EVERYTHING IS IN THE STATE THEN EXIT IMMEDIATELY
			if (availRepoIds.length === 0)
				return
			
			// SET LOADING
			availRepos = await updateLoadStatuses(
				availRepos,
				LoadStatus.Loading,
				LoadStatus.NotLoaded)
			
			// DELAYING FOR A QUICK STATE UPDATE TO DISPLAY LOADING STATUS
			log.debug(`Got available repos `, availRepos,availRepoIds)
			
			
			const
				repoIds = availRepos.map(item => item.id),
				
				// LOAD REPO, ASSIGNEES/COLLABS, LABELS & MILESTONES
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
						
						availRepos.forEach(it =>
							(it.collaborators = it.collaborators || [])
								.push(...models.filter(user => user.repoIds.includes(it.repoId))))
					})
				
				
				].concat(
					
					// Labels
					availRepos.map(availRepo =>
						stores.label.findByRepo(availRepo.id)
							.then(models => {
								availRepo.labels = models
							}),
					),
					
					// Milestones
					availRepos.map(availRepo =>
						stores.milestone.findByRepo(availRepo.id)
							.then(models => {
								availRepo.milestones = models
							})
					)
				)
			
			// WAIT FOR EVERYTHING TO LOAD
			await Promise.all(promises)
			
			// UPDATE ALL STATUSES
			availRepos = availRepos.map(it => assign(_.clone(it),{repoLoadStatus: LoadStatus.Loaded}))
			
			// ASSIGN TO NEW REF
			this.updateAvailableRepos(List<AvailableRepo>(availRepos))
			
			// QUICK DELAY
			await Promise.delay(100)
			
			// LOAD ISSUES
			getIssueActions().loadIssues()
			
		}
	}
	
	/**
	 * Clear selected repos
	 *
	 * @returns {(state:RepoState)=>Map<string, Array>}
	 */
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
	 *
	 * @param repo
	 */
	@ActionThunk()
	createAvailableRepo(repo:Repo) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				repoStore = getStores().repo,
				availRepoStore = getStores().availableRepo

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
	 * Remove the repo from the state
	 *
	 * @param repoId
	 */
	@ActionReducer()
	private removeAvailableRepoFromState(repoId:number) {
		return (state:RepoState) => state.set(
			'availableRepos',state.availableRepos.filter(it => it.id !== repoId))
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
			stores = getStores(),
			myUserId = _.get(getSettings(),'user.id')

		// Get the repo
		let
			availRepo = await stores.availableRepo.get(availRepoId)
		
		assert(availRepo,`Available repo not found for id ${availRepoId}`)
		
		const
			{repoId} = availRepo
		
		availRepo.deleted = true
		availRepo.enabled = false
		availRepo = await stores.availableRepo.save(availRepo)
		
		
		// FIRST - get everything out of the state
		log.debug(`Reloading avail repos`)
		this.removeAvailableRepoFromState(availRepo.id)

		log.debug('Cleaning up issue selections')
		getIssueActions().removeAllRepoResources(availRepo.id)
		
		log.debug(`Going to delay for a second then delete everything`)
		await Promise.delay(1000)


		// Retrieve every entity for the repo
		const
			labelIds = (await stores.label.findIdsByRepo(repoId)).map(url => `${repoId}-${url}`),
			milestoneIds = (await stores.milestone.findIdsByRepo(repoId)).map(id => `${repoId}-${id}`),
			
			// MAP ALL ISSUES TO ISSUE IDS
			issueIds = (await pagedFinder(
					Issue,
					100,
					getStores().issue,
					(issueStore:IssueStore, nextRequest:FinderRequest, lastIssues:Issue[]) =>
						issueStore.findByIssuePrefix(nextRequest, availRepo.repoId)
				)).map(issue => makeIssueId(issue)).toArray(),
			
			// ALL COMMENTS
			commentIds = (await pagedFinder(
				Comment,
				100,
				getStores().comment,
				(commentStore:CommentStore,nextRequest:FinderRequest) =>
					commentStore.findByRepoId(nextRequest,repoId)
				
			)).map(comment => makeCommentId(comment)).toArray(),
			
			// USERS
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
			removeUserIds = nilFilter(removeUsers.map(user => user.id)).map(id => id + ''),
			
			// Create a promise to remove everything
			removePromise = Promise.all([
				chunkRemove(commentIds,stores.comment),
				chunkRemove(labelIds,stores.label),
				chunkRemove(milestoneIds,stores.milestone),
				chunkRemove(issueIds,stores.issue),
				chunkRemove(removeUserIds,stores.user)
			])
		
		
		GithubSyncStatus.clearPrefix(`${availRepoId}`)
		
		// Wait for the all-clear
		await removePromise

		// WE DO THIS AT THE END JUST IN CASE THE APP EXITS
		// IN THE MIDDLE SO WE CAN CONTINUE DELETING AFTER
		await stores.availableRepo.remove(availRepoId)
		
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
			let
				stores = getStores(),
				availableRepos = availableReposSelector(getState()),
				availRepo = availableRepos.find(it => it.id === availRepoId)
			
			
			log.debug(`Setting available repo ${availRepo.id} to enabled ${enabled}`,availRepo,enabled)
			if (enabled === availRepo.enabled) {
				log.warn(`No change in avail repo enabled state`,availRepo,enabled)
				return
			}
			
			let
				persistentAvailRepo = await stores.availableRepo.get(availRepoId)
			
			availRepo.enabled = persistentAvailRepo.enabled = enabled
			await stores.availableRepo.save(persistentAvailRepo)
			
			
			
			
			// UPDATE THE ACTUAL REPO
			this.patchAvailableRepos({
				enabled,
				issuesLoadStatus: LoadStatus.NotLoaded
			},[availRepo])
			
			// IF NOT ENABLED THEN CLEAR ISSUES
			
			await Promise.delay(100)
			if (!enabled) {
				getIssueActions().removeAllRepoResources(availRepoId)
			} else {
				getIssueActions().loadIssues()
			}
			
			log.debug('Saved avail repo, setting enabled to',enabled)
			
		}
	}

}


export default RepoActionFactory