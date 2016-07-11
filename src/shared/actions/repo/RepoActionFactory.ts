




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

	// @Action()
	// issuesChanged(...updatedIssues:Issue[]) {
	// 	return(dispatch,getState) => {
	// 		const actions = this.withDispatcher(dispatch,getState)
	// 		const repoState = actions.state
	//
	// 		for (let updatedIssue of updatedIssues) {
	// 			let index = repoState.issues.findIndex(issue => issue.url === updatedIssue.url)
	// 			if (index > -1) {
	// 				const newIssues = [...repoState.issues]
	// 				newIssues[index] = cloneObject(updatedIssue)
	// 				actions.setIssues(newIssues)
	// 			}
	//
	// 			index = repoState.selectedIssues.findIndex(issue => issue.url === updatedIssue.url)
	// 			if (index > -1) {
	// 				const newIssues = [...repoState.selectedIssues]
	// 				newIssues[index] = cloneObject(updatedIssue)
	// 				actions.setSelectedIssues(newIssues)
	// 			}
	//
	// 			if (repoState.issue && repoState.issue.url === updatedIssue.url)
	// 				actions.setIssue(updatedIssue)
	// 		}
	// 	}
	// }

	@Action()
	addAvailableRepos(...availableRepos:AvailableRepo[]) {
	}

	@Action()
	issueSave(issue:Issue) {
		return async (dispatch,getState) => {
			// const actions = this.withDispatcher(dispatch,getState)
			// const client = github.createClient()
			//
			// const
			// 	repoState = this.state,
			// 	{repos} = repoState,
			// 	repo = issue.repo || repos.find(item => item.id === issue.repoId)
			//
			//
			//
			// try {
			// 	const issueStore:IssueStore = this.stores.issue
			// 	let savedIssue:Issue = await client.issueSave(repo,issue)
			// 	savedIssue = await issueStore.save(savedIssue)
			//
			// 	actions.issuesChanged(savedIssue)
			//
			//
			// 	this.uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
			// 	this.toaster.addMessage(`Saved issue #${savedIssue.number}`)
			//
			// } catch (err) {
			// 	log.error('failed to save issue', err)
			// 	this.toaster.addErrorMessage(err)
			// }
		}
	}

	/**
	 * Persis repos to database
	 *
	 * @param newRepos
	 */
	async persistRepos(newRepos:Repo[]):Promise<number> {
		// const repoStore =  this.stores.repo
		//
		// log.debug(`Persisting ${newRepos.length} repos`)
		// const beforeCount = await repoStore.count()
		// await repoStore.bulkSave(...newRepos)
		// const afterCount = await repoStore.count()
		//
		// log.debug(`After persistence there are ${afterCount} repos in the system, new count = ${afterCount - beforeCount}`)
		//
		// return afterCount - beforeCount
		return 0
	}

	@Action()
	syncRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			const client = github.createClient()

			try {

				// let repos = await client.userRepos({traversePages:true})
				// log.debug(`Received repos`,repos,'persisting now')
				//
				// const newRepoCount = await actions.persistRepos(repos)
				// log.debug('New repos',newRepoCount)
				//
				// const updatedRepos = cloneObject(actions.state.repos)
				//
				// // Deep merge the new repo data into the existing
				// // TODO: update sync functionality to use all of "MY" repos +
				// //  repos i follow, star and ones i added explicitly
				//
				// // TODO: update immutably
				// // repos.forEach(repo => {
				// // 	const updatedRepo = updatedRepos.find(item => item.id === repo.id)
				// // 	if (updatedRepo) {
				// // 		_.merge(updatedRepo,repo)
				// // 	} else {
				// // 		updatedRepos.push(repo)
				// // 	}
				// // })
				//
				// actions.setRepos(updatedRepos)
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

	/**
	 * Set the current issue being edited
	 *
	 * @param issue
	 */
	@Action()
	setEditingIssue(issue:Issue) {}


	/**
	 * Update the current issue being edited
	 *
	 * @param props
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	updateEditingIssue(props:any) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			// const {availableRepos,editingIssue:issue} = actions.state
			// if (!issue)
			// 	return
			//
			//
			// const updatedIssue = await fillIssue(
			// 		Object.assign(cloneObject(issue),props),
			// 		availableRepos
			// 	)
			//
			// actions.setEditingIssue(updatedIssue)
		}
	}

	/**
	 * Create a new issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	newIssue() {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				appActions = Container.get(AppActionFactory),
				dialogName = Dialogs.IssueEditDialog


			// const appActions = Container.get(AppActionFactory)

			if (this.uiActions.state.dialogs[dialogName]) {
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

			this.uiActions.setDialogOpen(dialogName,true)
		}
	}

	@Action()
	editIssue(issue:Issue = null) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog


			// const repoState = this.state,
			// 	{availableRepos} = repoState

			// issue = issue || repoState.selectedIssue
			// assert(issue,'You must have an issue selected in order to edit one ;)')
			//
			// issue = await fillIssue(issue,availableRepos)
			//
			// actions.setEditingIssue(issue)
			// this.uiActions.setDialogOpen(dialogName,true)
		}
	}



	@Action()
	loadIssue(issue:Issue,force:boolean = false) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// const currentIssue = actions.state.issue
			// if (!force && currentIssue && currentIssue.id === issue.id) {
			// 	return
			// }
			//
			// issue = cloneObject(issue)
			// actions.setIssue(issue)
			//
			// const comments = await this.stores.comment
			// 	.findByIssue(issue)
			//
			// actions.setComments(comments)


		}
	}



	@Action()
	loadIssues(...repoIds:number[]) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueStore = this.stores.issue

			log.info(`Loading issues for repos`,repoIds)
			const issues = await issueStore.findByRepoId(...repoIds)

			const dataActions = Container.get(DataActionFactory)
			dataActions.updateModels(Issue.$$clazz,issues.reduce((issueMap,nextIssue) => {
				issueMap[nextIssue.id] = nextIssue
				return issueMap
			},{}))
		}



	}

}


export default RepoActionFactory