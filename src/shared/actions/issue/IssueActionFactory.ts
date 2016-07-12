




import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {AutoWired,Inject,Container} from 'typescript-ioc'
import {Stores} from 'main/services/DBService'
import {List} from 'immutable'
import {ActionFactory,Action,ActionReducer} from 'typedux'
import {Dialogs, IssueKey, RepoKey, DataKey} from "shared/Constants"
import {cloneObject} from 'shared/util/ObjectUtil'


import {SyncStatus,ISyncDetails} from 'shared/models/Sync'
import {Comment} from 'shared/models/Comment'
import {IssueMessage, IssueState, IIssueSort, IIssueFilter} from './IssueState'
import {github} from 'shared'
import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {IssueStore,Issue} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import {RepoSyncJob} from 'main/services/jobs/RepoSyncJob'
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {DataRequest, DataState} from 'shared/actions/data/DataState'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {FinderRequest} from 'typestore'
import {ActionPromise} from 'typedux'
import {RepoState} from 'shared/actions/repo/RepoState'
import {enabledRepoIdSelector} from 'shared/actions/repo/RepoSelectors'



const uuid = require('node-uuid')

/**
 * Add transient properties to `Issue`
 * repo, milestones, collaborators
 *
 * @param issue
 * @param availableRepos
 * @returns {Issue}
 */
// export async function fillIssue(issue:Issue,availableRepos:List<AvailableRepo>) {
// 	let availRepo = availableRepos.find(availRepo => availRepo.repoId === issue.repoId)
// 	const stores:Stores = Container.get(Stores)
//
// 	if (!availRepo) {
// 		log.warn('Available repo not loaded', issue.repoId,'for issue',issue.title,'with id',issue.id,'going to load direct form db')
//
// 		const arStore = stores.availableRepo
// 		availRepo = await arStore.findByRepoId(issue.repoId)
// 		log.info(`Loaded available repo directly: ` + issue.repoId)
// 	}
//
// 	const filledAvailRepo = await stores.availableRepo.load(availRepo)
//
// 	return cloneObject(Object.assign({},issue, {
// 		repo: filledAvailRepo.repo,
// 		milestones: filledAvailRepo.milestones,
// 		collaborators: filledAvailRepo.collaborators
// 	}))
//
// }


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@AutoWired
export class IssueActionFactory extends ActionFactory<IssueState,IssueMessage> {

	@Inject
	stores:Stores

	@Inject
	uiActions:UIActionFactory

	@Inject
	jobActions:JobActionFactory

	@Inject
	toaster:Toaster



	constructor() {
		super(IssueState)
	}

	leaf():string {
		return IssueKey;
	}

	@ActionReducer()
	setSelectedIssueId(selectedIssueId:number) {
		return (state:IssueState) => state.merge({selectedIssueId})
	}

	@ActionReducer()
	setSelectedIssueIds(selectedIssueIds:number[]) {
		return (state:IssueState) => state.set('selectedIssueIds',selectedIssueIds)
	}




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
	 * Set the current issue being edited
	 *
	 * @param issue
	 */
	@ActionReducer()
	setEditingIssue(editingIssue:Issue) {
		return (state:IssueState) => state.set('editingIssue',editingIssue)
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


			if (this.uiActions.state.dialogs[dialogName]) {
				log.info('Dialog is already open',dialogName)
				return
			}

			// const {availableRepos,selectedIssues} = getState().get(RepoKey)
			// const repoId = (selectedIssues && selectedIssues.size) ?
			// 	selectedIssues.get(0).repoId :
			// 	(availableRepos && availableRepos.size) ?
			// 		availableRepos.get(0).repoId :
			// 		null
			//
			// if (!repoId) {
			// 	this.toaster.addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
			// 	return
			// }
			//
			// const issue = await fillIssue(new Issue({repoId}),availableRepos)
			//
			// actions.setEditingIssue(issue)

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


	@ActionReducer()
	protected setInternalIssues(issues:Issue[]) {
		return (issueState:IssueState) => issueState.set('internalIssues',issues)
	}

	@ActionReducer()
	protected setCommentIds(commentIds:string[]) {
		return (issueState:IssueState) => issueState.set('commentIds',commentIds)
	}

	@ActionReducer()
	setFilteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return (issueState:IssueState,getState) => {

			const repoIds = enabledRepoIdSelector(getState())

			issueSort = issueSort || issueState.issueSort
			issueFilter = issueFilter || issueState.issueFilter

			const {internalIssues} = issueState

			let {text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter,
				{fields:sortFields,direction:sortDirection} = issueSort

			milestoneIds = milestoneIds || []
			labelUrls = labelUrls || []
			assigneeIds = assigneeIds || []

			let filteredIssues = internalIssues
				.filter(issue => {
					if (issueId)
						return `${issue.id}` === `${issueId}`

					let matches = repoIds.includes(issue.repoId)
					if (matches && milestoneIds.length)
						matches = issue.milestone && milestoneIds.includes(issue.milestone.id)

					if (matches && labelUrls.length)
						matches = issue.labels && labelUrls.some(url => issue.labels.findIndex(label => label.url === url) > -1)

					if (matches && assigneeIds.length)
						matches = issue.assignee && assigneeIds.includes(issue.assignee.id)

					if (matches && text)
						matches = _.toLower(issue.title + issue.body + _.get(issue.assignee,'login')).indexOf(_.toLower(text)) > -1

					return matches
				})

			filteredIssues = _.sortBy(filteredIssues,sortFields[0])

			if (sortDirection === 'desc')
				filteredIssues = filteredIssues.reverse()

			const issueIds = filteredIssues.map(issue => issue.id)

			return issueState.withMutations((newIssueState:IssueState) => {


				if (issueFilter)
					newIssueState.set('issueFilter', issueFilter)

				if (issueSort)
					newIssueState.set('issueSort', issueSort)




				return newIssueState.set('issueIds',issueIds)
			})
		}
	}


	@Action()
	loadIssues(...repoIds:number[]) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueState = this.state
			const issueStore = this.stores.issue


			log.info(`Loading issues for repos`,repoIds)
			const issues = await issueStore.findByRepoId(...repoIds)
			const issueIds = issues.map(issue => `${issue.id}`)
			const issueMap = _.modelArrayToMapBy(issues,'id')

			// Now push the models into the data state for tracking
			const dataActions = Container.get(DataActionFactory)
			await dataActions.submitRequest(DataRequest.create('issues-list',false,issueIds,Issue.$$clazz),issueMap)

			actions.setInternalIssues(issues)
			actions.setFilteringAndSorting()

		}

	}

	@Action()
	loadActivityForIssue(issueId:number) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)

			// Issue repo
			const issueState = this.state
			const dataState:DataState = getState().get(DataKey)

			let issue:Issue = dataState.models.get(Issue.$$clazz).get(`${issueId}`)
			if (!issue) {
				log.warn(`Issue not found in data state: ${issueId}`)
				issue = await this.stores.issue.get(issueId)
				assert(issue,`Issue still not found ${issueId}`)
			}




			log.info(`Loading activity for issue `,issueId)
			const comments = await this.stores.comment.findByIssueNumber(issue.repoId,issue.number)
			const commentIds = _.sortBy(comments.map(comment => `${comment.id}`),'created_at')
			const commentMap = _.modelArrayToMapBy(comments,'id')

			log.info(`Loaded ${comments.length} comments`)

			// Now push the models into the data state for tracking
			const dataActions = Container.get(DataActionFactory)
			await dataActions.submitRequest(DataRequest.create('comments-list',false,commentIds,Comment.$$clazz),commentMap)

			actions.setCommentIds(commentIds)
			actions.setFilteringAndSorting()

		}
	}

}


export default IssueActionFactory