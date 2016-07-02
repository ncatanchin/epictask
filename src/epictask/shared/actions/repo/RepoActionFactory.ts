



/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {List} from 'immutable'
import {ActionFactory,Action} from 'typedux'
import {RepoKey,Dialogs} from "shared/Constants"
import {Repos} from 'main/db/DB'
import {cloneObject} from 'shared/util/ObjectUtil'


import {SyncStatus,ISyncDetails,Comment} from 'shared/models'
import {RepoMessage,RepoState} from './RepoState'
import {github} from 'epictask/shared'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {IssueRepo,Issue} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from './RepoSyncJob'


const uuid = require('node-uuid')

/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

export class RepoActionFactory extends ActionFactory<any,RepoMessage> {


	/**
	 * Add transient properties to `Issue`
	 * repo, milestones, collaborators
	 *
	 * @param issue
	 * @param availableRepos
	 * @returns {Issue}
	 */
	static async fillIssue(issue:Issue,availableRepos:List<AvailableRepo>) {
		//issue = cloneObject(issue)

		let availRepo = availableRepos.find(availRepo => availRepo.repoId === issue.repoId)
		assert(availRepo,"Available repo is null - but we loaded an issue that maps to it: " + issue.id)

		const filledAvailRepo = await Repos.availableRepo.load(availRepo)

		return cloneObject(Object.assign({},issue, {
			repo: filledAvailRepo.repo,
			milestones: filledAvailRepo.milestones,
			collaborators: filledAvailRepo.collaborators
		}))

	}

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
	issuesChanged(...updatedIssues:Issue[]) {
		return(dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const repoState = actions.state

			for (let updatedIssue of updatedIssues) {
				let index = repoState.issues.findIndex(issue => issue.url === updatedIssue.url)
				if (index > -1) {
					const newIssues = [...repoState.issues]
					newIssues[index] = cloneObject(updatedIssue)
					actions.setIssues(newIssues)
				}

				index = repoState.selectedIssues.findIndex(issue => issue.url === updatedIssue.url)
				if (index > -1) {
					const newIssues = [...repoState.selectedIssues]
					newIssues[index] = cloneObject(updatedIssue)
					actions.setSelectedIssues(newIssues)
				}

				if (repoState.issue && repoState.issue.url === updatedIssue.url)
					actions.setIssue(updatedIssue)
			}
		}
	}

	@Action()
	setAvailableRepos(repos:AvailableRepo[]) {
	}

	@Action()
	issueSave(issue:Issue) {
		return async (dispatch,getState) => {
			const toastService = require('shared/actions/toast/ToastService')
			const actions = this.withDispatcher(dispatch,getState)
			const client = github.createClient()

			const
				repoState = this.state,
				{repos} = repoState,
				repo = issue.repo || repos.find(item => item.id === issue.repoId)



			try {
				const issueRepo:IssueRepo = Repos.issue
				let savedIssue:Issue = await client.issueSave(repo,issue)
				savedIssue = await issueRepo.save(savedIssue)

				actions.issuesChanged(savedIssue)

				const appActions = new AppActionFactory()
				appActions.setDialogOpen(Dialogs.IssueEditDialog, false)
				toastService.addMessage(`Saved issue #${savedIssue.number}`)

			} catch (err) {
				log.error('failed to save issue', err)
				toastService.addErrorMessage(err)
			}
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
				// TODO: update immutably
				// repos.forEach(repo => {
				// 	const updatedRepo = updatedRepos.find(item => item.id === repo.id)
				// 	if (updatedRepo) {
				// 		_.merge(updatedRepo,repo)
				// 	} else {
				// 		updatedRepos.push(repo)
				// 	}
				// })

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

			const loadedAvailRepo = await Repos.availableRepo.load(availRepo)
			jobActions.createJob(new RepoSyncJob(loadedAvailRepo))
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
			const availRepos = await Repos.availableRepo.loadAll()

			const
				repoState = actions.state,
				{repos} = repoState


			log.debug('Loaded available repos',availRepos)
			actions.setAvailableRepos(availRepos)

			return availRepos
		}) as any
	}

	@Action()
	getRepo(id:number):Promise<Repo> {
		return (async (dispatch,getState) => {
			const repoRepo = Repos.repo
			return await repoRepo.get(repoRepo.key(id))
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
	createAvailableRepo(repo:Repo) {
		return async(dispatch, getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			const availRepos = actions.state.availableRepos

			if (availRepos.findIndex(availRepo => availRepo.repoId === repo.id) > -1) {
				throw new Error('Repository is already selected: ' + repo.full_name)
			}

			const
				availRepoRepo = Repos.availableRepo,
				availRepo = new AvailableRepo({
					id: uuid.v4(),
					repoId: repo.id,
					enabled: true
				})

			log.info('Saving new available repo as ',availRepo.id)
			await availRepoRepo.save(availRepo)

			actions.getAvailableRepos()
			actions.syncRepoDetails(availRepo)
		}
	}

	@Action()
	removeAvailableRepo(availRepoId:string) {
		return async(dispatch, getState) => {
			const actions = this.withDispatcher(dispatch, getState)


			const availRepoRepo = Repos.availableRepo
			await availRepoRepo.remove(availRepoId)

			const availRepos = actions.state.availableRepos
			actions.setAvailableRepos(availRepos.filter(availRepo => availRepo.id !== availRepoId))

		}
	}




	@Action()
	setRepoEnabled(availRepoId:string,enabled:boolean) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const availRepo = await Repos.availableRepo.get(availRepoId)
			if (enabled === availRepo.enabled) {
				return
			}

			let newAvailRepo = Object.assign({},availRepo,{enabled})

			await Repos.availableRepo.save(newAvailRepo)
			newAvailRepo = await Repos.availableRepo.load(newAvailRepo)
			actions.updateAvailableRepo(newAvailRepo)

			// Finally trigger a repo sync update
			if (enabled)
				this.syncRepoDetails(newAvailRepo)

			log.info('Saved avail repo, setting enabled to',enabled,newAvailRepo)



			return true
		}
	}


	@Action()
	loadIssue(issue:Issue,force:boolean = false) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			const currentIssue = actions.state.issue
			if (!force && currentIssue && currentIssue.id === issue.id) {
				return
			}

			issue = cloneObject(issue)
			actions.setIssue(issue)

			const comments = await Repos.comment
				.findByIssue(issue)

			actions.setComments(comments)


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
			const repoIds = availableRepos
				.filter(availRepo => availRepo.enabled)
				.map(availRepo => availRepo.repoId)
				.toArray()


			log.info(`Loading issues for repos`,repoIds)
			let issues = (!repoIds.length) ? [] : await issueRepo.findByRepoId(...repoIds)

			/**
			 * 1. Clone issues first to avoid cached objects
			 * 2. Make sure we have a valid repo
			 * 3. Copy transient repo,milestones,collaborators,etc
			 */
			const issuePromises = issues.map(issue => RepoActionFactory.fillIssue(issue,availableRepos))

			const filledIssues = await Promise.all(issuePromises)

			actions.setIssues(filledIssues)
		}



	}

}