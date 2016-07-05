



import {Stores} from 'main/services/DBService'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {AutoWired,Inject,Container} from 'typescript-ioc'
import {List} from 'immutable'
import {ActionFactory,Action} from 'typedux'
import {RepoKey,Dialogs} from "shared/Constants"
import {cloneObject} from 'shared/util/ObjectUtil'


import {SyncStatus,ISyncDetails,Comment} from 'shared/models'
import {RepoMessage,RepoState} from './RepoState'
import {github} from 'epictask/shared'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {IssueStore,Issue} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from './RepoSyncJob'
import Toaster from 'shared/Toaster'


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
	const stores = Container.get(Stores)

	if (!availRepo) {
		log.warn('Available repo not loaded', issue.repoId,'for issue',issue.title,'with id',issue.id,'going to load direct form db')

		const arStore = stores.availableRepo
		availRepo = await arStore.findByRepoId(issue.repoId)
		log.info(`Loaded available repo directly: ` + availRepo.repoId)
	}


	// assert(availRepo,"Available repo is null - but we loaded an issue that maps to it: " + issue.id)



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
export class RepoActionFactory extends ActionFactory<any,RepoMessage> {

	@Inject
	stores:Stores

	@Inject
	appActions:AppActionFactory

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
			const actions = this.withDispatcher(dispatch,getState)
			const client = github.createClient()

			const
				repoState = this.state,
				{repos} = repoState,
				repo = issue.repo || repos.find(item => item.id === issue.repoId)



			try {
				const issueStore:IssueStore = this.stores.issue
				let savedIssue:Issue = await client.issueSave(repo,issue)
				savedIssue = await issueStore.save(savedIssue)

				actions.issuesChanged(savedIssue)


				this.appActions.setDialogOpen(Dialogs.IssueEditDialog, false)
				this.toaster.addMessage(`Saved issue #${savedIssue.number}`)

			} catch (err) {
				log.error('failed to save issue', err)
				this.toaster.addErrorMessage(err)
			}
		}
	}

	/**
	 * Persis repos to database
	 *
	 * @param newRepos
	 */
	async persistRepos(newRepos:Repo[]):Promise<number> {
		const repoStore =  this.stores.repo

		log.debug(`Persisting ${newRepos.length} repos`)
		const beforeCount = await repoStore.count()
		await repoStore.bulkSave(...newRepos)
		const afterCount = await repoStore.count()

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
			const jobActions = this.jobActions
				.withDispatcher(dispatch,getState)

			const loadedAvailRepo = await this.stores.availableRepo.load(availRepo)
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
			const availRepos = await this.stores.availableRepo.loadAll()

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
			const repoStore = this.stores.repo
			return await repoStore.get(repoStore.key(id))
		}) as any
	}

	@Action()
	getRepos():Promise<Repo[]> {
		return (async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			let repos = await this.stores.repo.findAll()
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
				repoStore = this.stores.repo,
				availRepoStore = this.stores.availableRepo,
				availRepo = new AvailableRepo({
					id: uuid.v4(),
					repoId: repo.id,
					enabled: true
				})

			// Make sure the repo passed in exists in out
			// local DB
			let savedRepo = await repoStore.get(repo.id)
			if (!savedRepo) {
				log.info('Create available repo request with a repo that isnt in the db - probably direct query result from GitHUb, adding')
				await repoStore.save(repo)
			}

			log.info('Saving new available repo as ',availRepo.id)
			await availRepoStore.save(availRepo)

			actions.getAvailableRepos()
			actions.syncRepoDetails(availRepo)
		}
	}

	@Action()
	removeAvailableRepo(availRepoId:string) {
		return async(dispatch, getState) => {
			const actions = this.withDispatcher(dispatch, getState)


			const availRepoRepo = this.stores.availableRepo
			await availRepoRepo.remove(availRepoId)

			const availRepos = actions.state.availableRepos
			actions.setAvailableRepos(availRepos.filter(availRepo => availRepo.id !== availRepoId))

		}
	}




	@Action()
	setRepoEnabled(availRepoId:string,enabled:boolean) {
		return async (dispatch,getState) => {
			const {
				repo:repoStore,
				availableRepo:availableRepoStore
			} = this.stores

			const actions = this.withDispatcher(dispatch,getState)
			const availRepo = await availableRepoStore.get(availRepoId)
			if (enabled === availRepo.enabled) {
				return
			}

			let newAvailRepo = Object.assign({},availRepo,{enabled})

			await availableRepoStore.save(newAvailRepo)
			newAvailRepo = await availableRepoStore.load(newAvailRepo)
			actions.updateAvailableRepo(newAvailRepo)

			// Finally trigger a repo sync update
			if (enabled)
				this.syncRepoDetails(newAvailRepo)

			log.info('Saved avail repo, setting enabled to',enabled,newAvailRepo)



			return true
		}
	}

	@Action()
	setEditingIssue(issue:Issue) {}

	@Action()
	updateEditingIssue(props:any) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			const {availableRepos,editingIssue:issue} = actions.state
			if (!issue)
				return


			const updatedIssue = await fillIssue(
					Object.assign(cloneObject(issue),props),
					availableRepos
				)

			actions.setEditingIssue(updatedIssue)
		}
	}

	@Action()
	newIssue() {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				{appActions} = actions,
				dialogName = Dialogs.IssueEditDialog


			// const appActions = Container.get(AppActionFactory)

			if (appActions.state.dialogs[dialogName]) {
				log.info('Dialog is already open',dialogName)
				return
			}

			const {availableRepos,selectedIssues} = getState().get(RepoKey)
			const repoId = (selectedIssues && selectedIssues.size) ?
				selectedIssues.get(0).repoId :
				(availableRepos && availableRepos.size) ?
					availableRepos.get(0).repoId :
					null

			if (!repoId) {
				this.toaster.addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}

			const issue = await fillIssue(new Issue({repoId}),availableRepos)

			actions.setEditingIssue(issue)

			appActions.setDialogOpen(dialogName,true)
		}
	}

	@Action()
	editIssue(issue:Issue = null) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog


			const repoState = this.state,
				{availableRepos} = repoState

			issue = issue || repoState.selectedIssue
			assert(issue,'You must have an issue selected in order to edit one ;)')

			issue = await fillIssue(issue,availableRepos)

			actions.setEditingIssue(issue)
			this.appActions.setDialogOpen(dialogName,true)
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

			const comments = await this.stores.comment
				.findByIssue(issue)

			actions.setComments(comments)


		}
	}



	@Action()
	loadIssues() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueRepo = this.stores.issue

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
			const issuePromises = issues.map(issue => fillIssue(issue,availableRepos))

			const filledIssues = await Promise.all(issuePromises)

			actions.setIssues(filledIssues)
		}



	}

}


export default RepoActionFactory