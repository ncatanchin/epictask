



/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {RepoKey} from "shared/Constants"
import {Repos} from 'shared/DB'
import {LunrIndex} from 'shared/LunrIndex'

import {SyncStatus,ISyncDetails,Comment,Activity,ActivityRepo,ActivityType} from 'shared/models'
import {RepoState} from './RepoState'
import {RepoMessage} from './RepoReducer'
import {Repo,AvailableRepo,Issue,github} from 'epictask/shared'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from './RepoSyncJob'


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

 export class RepoActionFactory extends ActionFactory<any,RepoMessage> {

	constructor() {
		super(RepoState)
	}

	leaf():string {
		return RepoKey;
	}

	@Action()
	setRepos(repos:Repo[]) {
	}

	@Action()
	setRepo(repo:Repo) {
	}

	@Action()
	setIssue(issue:Issue) {}

	@Action()
	setComments(comments:Comment[]) {}

	@Action()
	setIssues(issues:Issue[]) {}


	@Action()
	setAvailableRepos(repos:AvailableRepo[]) {
	}

	/**
	 * Persis repos to database
	 *
	 * @param newRepos
	 */
	private async persistRepos(newRepos:Repo[]):Promise<number> {
		const repoRepo =  Repos.repo

		log.debug(`Persisting ${newRepos.length} repos`)
		const beforeCount = await repoRepo.count()
		await repoRepo.bulkSave(...newRepos)
		const afterCount = await repoRepo.count()

		log.debug(`After persistence there are ${afterCount} repos in the system, new count = ${afterCount - beforeCount}`)

		return afterCount - beforeCount
	}

	@Action()
	syncRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			const client = github.createClient()

			try {

				let repos = await client.userRepos({traversePages:true})
				log.debug(`Received repos`,repos,'persisting now')

				const newRepoCount = await actions.persistRepos(repos)
				log.debug('New repos',newRepoCount)
				actions.setRepos(repos)
			} catch (err) {
				log.error('Failed to get repos',err,err.stack)
				actions.setError(err)
				throw err
			}
		}
	}

	@Action()
	setSyncStatus(availRepo:AvailableRepo,status:SyncStatus,details:ISyncDetails) {}


	/**
	 * Sync issues
	 * @param availRepo
	 * @returns {function(any, any): Promise<undefined>}
	 */
	@Action()
	syncRepoDetails(availRepo:AvailableRepo) {
		return async (dispatch,getState) => {
			const jobActions = JobActionFactory.newWithDispatcher(JobActionFactory,dispatch,getState)

			await availRepo.getRepo()

			jobActions.createJob(new RepoSyncJob(availRepo))
		}
	}

	/**
	 * Starts a synchronization for all repos that
	 * have been marked as available by the user
	 *
	 * _note_: this includes repos that are not enabled
	 */
	@Action()
	syncAllRepoDetails() {
		return async(dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			log.debug('Getting avail repos from DB, not state')
			const availRepos = await actions.getAvailableRepos()
			availRepos.forEach(availRepo => {
				actions.syncRepoDetails(availRepo)
			})
		}
	}


	@Action()
	getAvailableRepos():Promise<AvailableRepo[]> {
		return (async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const availRepos = await Repos.availableRepo.findAll()

			const repoRepo = Repos.repo

			availRepos.forEach(async (availRepo) => {
				const repoState = actions.state
				availRepo.repo = availRepo.repo ||
					repoState.repos.find(repo => repo.id === availRepo.repoId)

				if (availRepo.repo)
					return

				availRepo.repo = await repoRepo.get(repoRepo.key(availRepo.repoId))

			})

			log.debug('Loaded available repos',availRepos)
			actions.setAvailableRepos(availRepos)

			return availRepos
		}) as any
	}

	@Action()
	getRepo(id:number):Promise<Repo> {
		return (async (dispatch,getState) => {
			const repoRepo = Repos.repo
			const repo = await repoRepo.get(repoRepo.key(id))
			return repo
		}) as any
	}

	@Action()
	getRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const repos = await Repos.repo.findAll()
			log.debug('Loaded all repos',repos)
			actions.setRepos(repos)
		}
	}

	@Action()
	clearSelectedRepos() { }

	@Action()
	updateAvailableRepo(availRepo:AvailableRepo) {}

	@Action()
	setRepoSelected(selectedAvailableRepo:AvailableRepo,selected:boolean) { }

	@Action()
	setSelectedIssues(selectedIssues:Issue[]) {}

	@Action()
	setRepoEnabled(availRepo:AvailableRepo,enabled:boolean) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			if (enabled === availRepo.enabled) {
				return
			}

			const availRepoRepo = Repos.availableRepo
			const newAvailRepo = new AvailableRepo(availRepoRepo.mapper.toObject(availRepo))
			newAvailRepo.enabled = enabled

			await availRepoRepo.save(newAvailRepo)
			actions.updateAvailableRepo(newAvailRepo)

			// Finally trigger a repo sync update
			this.syncRepoDetails(newAvailRepo)

			log.info('Saved avail repo, setting enabled to',enabled,newAvailRepo)

			return true
		}
	}


	@Action()
	loadIssue(issue:Issue){
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			return new Promise((resolve:any,reject:any) => {

				const currentIssue = actions.state.issue
				if (currentIssue && currentIssue.id === issue.id) {
					return resolve(true)
				}

				actions.setIssue(issue)

				Repos.comment
					.findByIssue(issue)
					.then(comments => actions.setComments(comments))
					.then(resolve).catch(reject)
			})

		}
	}

	@Action()
	loadIssues() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueRepo = Repos.issue

			// All the currently selected repos
			const {availableRepos} = actions.state
			const enabledRepos = availableRepos.filter(availRepo => availRepo.enabled)
			const repos = await Promise.all(enabledRepos.map((availRepo) => availRepo.getRepo()))
			const repoIds = repos.map((repo:Repo) => repo.id)

			log.info(`Loading issues for repos`,repoIds)
			const issues = (!repoIds.length) ? [] : await issueRepo.findByRepoId(...repoIds)

			actions.setIssues(issues)
		}



	}

}