



/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {RepoKey,RepoTransientProps,Dialogs} from "shared/Constants"
import {Repos} from 'shared/DB'
import {cloneObject} from 'shared/util/ObjectUtil'
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

	@Action()
	issueSave(issue:Issue) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const client = github.createClient()

			const {repos} = this.state
			const repo = issue.repo || repos.find(item => item.id === issue.repoId)


			return client.issueSave(repo,issue)
				.then(savedIssue => {
					return Repos.issue.save(savedIssue)
				})
				.then(savedIssue => {
					require('app/services/ToastService').addMessage(`Saved issue #${savedIssue.number}`)

					const appActions = new AppActionFactory()
					appActions.setDialogOpen(Dialogs.IssueEditDialog, false)
				})
				.catch(err => {
					require('app/services/ToastService').addErrorMessage(err)
				})

		}
	}

	/**
	 * Persis repos to database
	 *
	 * @param newRepos
	 */
	async persistRepos(newRepos:Repo[]):Promise<number> {
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

				// Deep merge the new repo data into the existing
				// TODO: update sync functionality to use all of "MY" repos +
				//  repos i follow, star and ones i added explicitly
				const updatedRepos = cloneObject(actions.state.repos)
				repos.forEach(repo => {
					const updatedRepo = updatedRepos.find(item => item.id === repo.id)
					if (updatedRepo) {
						_.merge(updatedRepo,repo)
					} else {
						updatedRepos.push(repo)
					}
				})

				actions.setRepos(updatedRepos)
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

			const
				repoRepo = Repos.repo,
				repoState = actions.state,
				{repos} = repoState

			await Promise.all(availRepos.map(async (availRepo) => {

				if (!availRepo.repo) {
					availRepo.repo = await repoRepo.get(repoRepo.key(availRepo.repoId))
				}

				if (!availRepo.labels) {
					availRepo.labels = await Repos.label.findByRepoId(availRepo.repoId)
				}

				if (!availRepo.milestones) {
					availRepo.milestones = await Repos.milestone.findByRepoId(availRepo.repoId)
				}

				if (!availRepo.collaborators) {
					availRepo.collaborators = await Repos.user.findByRepoId(availRepo.repoId)
				}

				return availRepo
			}))

			log.debug('Loaded available repos',availRepos)
			actions.setAvailableRepos(availRepos
				.map(availRepo => cloneObject(availRepo)))

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
	getRepos():Promise<Repo[]> {
		return (async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			let repos = await Repos.repo.findAll()
			repos = cloneObject(repos)
			log.debug('Loaded all repos',repos)

			actions.setRepos(repos)
			return repos
		}) as any
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

			const newAvailRepo = Object.assign(cloneObject(availRepo),{enabled})

			Repos.availableRepo.save(newAvailRepo)
				.then(() => {
					actions.updateAvailableRepo(newAvailRepo)

					// Finally trigger a repo sync update
					if (enabled)
						this.syncRepoDetails(newAvailRepo)

					log.info('Saved avail repo, setting enabled to',enabled,newAvailRepo)
				})


			return true
		}
	}


	@Action()
	loadIssue(issue:Issue,force:boolean = false){
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			return new Promise((resolve:any,reject:any) => {


				const currentIssue = actions.state.issue
				if (!force && currentIssue && currentIssue.id === issue.id) {
					return resolve(true)
				}

				issue = cloneObject(issue)
				actions.setIssue(issue)

				Repos.comment
					.findByIssue(issue)
					.then(comments => actions.setComments(comments))
					.then(resolve).catch(reject)
			})

		}
	}

	fillIssue(issue:Issue) {

	}

	@Action()
	loadIssues() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueRepo = Repos.issue

			// All the currently selected repos
			const {availableRepos} = actions.state
			const repoIds = availableRepos
				.filter(availRepo => availRepo.enabled)
				.map(availRepo => availRepo.repoId)


			log.info(`Loading issues for repos`,repoIds)
			let issues = (!repoIds.length) ? [] : await issueRepo.findByRepoId(...repoIds)

			/**
			 * 1. Clone issues first to avoid cached objects
			 * 2. Make sure we have a valid repo
			 * 3. Copy transient repo,milestones,collaborators,etc
			 */
			issues = issues.map(issue => {
				issue = cloneObject(issue)

				const availRepo = availableRepos.find(availRepo => availRepo.repoId === issue.repoId)
				assert(availRepo,"Available repo is null - but we loaded an issue that maps to it: " + issue.id)
				Object.assign(issue, {
					repo: availRepo.repo,
					milestones: [...availRepo.milestones],
					collaborators: [...availRepo.collaborators]
				})

				return issue
			})

			actions.setIssues(issues)
		}



	}

}