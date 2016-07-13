



import {FinderRequest} from 'typestore'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import {Stores} from 'main/services/DBService'
import {ActionFactory, Action, ActionReducer} from 'typedux'
import {Dialogs, IssueKey, DataKey, DataRequestIssueListId} from 'shared/Constants'
import {cloneObject} from 'shared/util/ObjectUtil'
import {Comment} from 'shared/models/Comment'
import {IssueMessage, IssueState, IIssueSort, IIssueFilter} from './IssueState'
import {Issue, IssueStore} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {JobActionFactory} from '../jobs/JobActionFactory'
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {DataRequest, DataState} from 'shared/actions/data/DataState'
import {enabledRepoIdsSelector, availRepoIdsSelector, availReposSelector} from 'shared/actions/repo/RepoSelectors'
import {selectedIssueIdsSelector, issueSelector} from 'shared/actions/issue/IssueSelectors'
import {issueModelsSelector, repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {GitHubClient} from 'shared/GitHubClient'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS


const uuid = require('node-uuid')

/**
 * Add transient properties to `Issue`
 * repo, milestones, collaborators
 *
 * @param issue
 * @returns {({}&Issue&{repo: Repo, milestones: Milestone[], collaborators: User[]})|any|*}
 * @param repoId
 */
export async function fillIssue(issue:Issue,repoId:number) {
	const stores:Stores = Container.get(Stores)

	const filledAvailRepo = await stores.availableRepo.load(repoId)

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
export class IssueActionFactory extends ActionFactory<IssueState,IssueMessage> {

	@Inject
	stores:Stores

	@Inject
	uiActions:UIActionFactory

	@Inject
	toaster:Toaster

	constructor() {
		super(IssueState)
	}

	leaf():string {
		return IssueKey;
	}

	setIssuesAction(issues:Issue[],clear:boolean,dispatch,getState)  {
		const actions = this.withDispatcher(dispatch, getState)
		const enabledRepoIds = enabledRepoIdsSelector(getState())

		issues = issues
			.filter(issue => enabledRepoIds.includes(issue.repoId))
			.map(issue => {
				issue.labels = issue.labels || []
				return issue
			})

		const issueIds = issues.map(issue => `${issue.id}`)
		const issueMap = _.modelArrayToMapBy(issues,'id')

		// Now push the models into the data state for tracking
		const dataActions = Container.get(DataActionFactory)
		const dataRequest = DataRequest.create(DataRequestIssueListId,false,issueIds,Issue.$$clazz,clear)

		dataActions.submitRequest(dataRequest,issueMap)
		actions.setInternalIssues(issues)



	}

	/**
	 * Internally change the issue list
	 *
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	private setIssues(issues:Issue[],clear=true) {
		return (dispatch,getState) => this.setIssuesAction(issues,clear,dispatch,getState)
	}


	/**
	 * The the selected issue ids
	 *
	 * (Highlighted issues in the main list)
	 *
	 * @param selectedIssueIds
	 * @returns {(state:IssueState)=>Map<string, number[]>}
	 */
	@ActionReducer()
	setSelectedIssueIds(selectedIssueIds:number[]) {
		return (state:IssueState) => state.set('selectedIssueIds',selectedIssueIds)
	}



	@Action()
	issueSave(issue:Issue) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const client = Container.get(GitHubClient)

			const repoModels = repoModelsSelector(getState())
			const enabledRepoIds = enabledRepoIdsSelector(getState())
			const repo = issue.repo || repoModels.get(`${issue.repoId}`)

			try {
				const issueStore:IssueStore = this.stores.issue

				// First save to github
				let savedIssue:Issue = await client.issueSave(repo,issue)

				const persistedIssue = await issueStore.save(savedIssue)

				const updatedIssue = _.cloneDeep(persistedIssue)

				// If the issue belongs to an enabled repo then reload issues
				if (enabledRepoIds.includes(updatedIssue.repoId)) {
					let internalIssues = actions.state.internalIssues
					if (!internalIssues)
						actions.loadIssues(...enabledRepoIds)
					else {
						const issueMatcher = item => item.id !== updatedIssue.id && !(item.repoId !== updatedIssue.repoId && item.number !== updatedIssue.number)

						internalIssues = internalIssues.filter(issueMatcher).concat([updatedIssue])

						actions.setIssues(internalIssues)

					}
				}


				this.uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
				this.toaster.addMessage(`Saved issue #${updatedIssue.number}`)

			} catch (err) {
				log.error('failed to save issue', err)
				this.toaster.addErrorMessage(err)
			}
		}
	}

	/**
	 * Set the current issue being edited
	 *
	 * @param editingIssue
	 * @return {(state:IssueState)=>Map<string, Issue>}
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

			const state = getState()

			const selectedIssueIds = selectedIssueIdsSelector(state) || []
			const availRepoIds = availRepoIdsSelector(state)
			const issueModels = issueModelsSelector(state)
			const availRepos = _.sortBy(availReposSelector(state),'enabled')

			const selectedIssueId = selectedIssueIds.length && `${selectedIssueIds[0]}`

			const selectedIssue =
				(selectedIssueId && issueModels.has(selectedIssueId)) ?
					issueModels.get(selectedIssueId) : null

			const repoId = (selectedIssue) ? selectedIssue.repoId :
				(availRepos.length) ? availRepos[0].repoId : null

			if (!repoId) {
				this.toaster.addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}

			const issue = await fillIssue(new Issue({repoId}),repoId)

			actions.setEditingIssue(issue)

			this.uiActions.setDialogOpen(dialogName,true)
		}
	}

	@Action()
	editIssue() {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog,
				issue = issueSelector(getState())

			assert(issue,'You must have an issue selected in order to edit one ;)')

			const editingIssue = await fillIssue(_.cloneDeep(issue),issue.repoId)

			actions.setEditingIssue(editingIssue)
			this.uiActions.setDialogOpen(dialogName,true)
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


	private filteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return (issueState:IssueState,getState) => {

			const repoIds = enabledRepoIdsSelector(getState())

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


	@ActionReducer()
	protected setInternalIssues(issues:Issue[]) {
		return (issueState:IssueState,getState) => {
			issueState = issueState.set('internalIssues',issues) as IssueState

			return this.filteringAndSorting(
				issueState.issueFilter,
				issueState.issueSort
			)(issueState,getState)
		}
	}

	@ActionReducer()
	protected setCommentIds(commentIds:string[]) {
		return (issueState:IssueState) => issueState.set('commentIds',commentIds)
	}

	@ActionReducer()
	setFilteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return this.filteringAndSorting(issueFilter,issueSort)
	}


	private async loadIssuesAction(repoIds:number[],dispatch,getState) {
		const actions = this.withDispatcher(dispatch, getState)

		// Issue repo
		const issueState = this.state
		const issueStore = this.stores.issue


		log.info(`Loading issues for repos`,repoIds)

		let offset = 0
		const limit = 20
		while (true) {
			log.info(`Requesting issues page # ${(offset / limit) + 1}`)
			const request = new FinderRequest(limit,offset)
			const issues = await issueStore.findByRepoIdWithRequest(request,...repoIds)
			actions.setIssues(issues,false)
			if (issues.length === 0 || issues.length < limit)
				break

			offset += limit

		}


	}

	@Action()
	loadIssues(...repoIds:number[]) {
		return (dispatch,getState) => this.loadIssuesAction(repoIds,dispatch,getState)
	}

	@Action()
	clearAndLoadIssues(...repoIds:number[]) {
		return (dispatch,getState) => {
			this.setIssuesAction([],true,dispatch,getState)
			this.loadIssuesAction(repoIds,dispatch,getState)
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
			await dataActions.submitRequest(DataRequest.create('comments-list',false,commentIds,Comment.$$clazz,true),commentMap)

			actions.setCommentIds(commentIds)
			//actions.setFilteringAndSorting()

		}
	}

}


export default IssueActionFactory