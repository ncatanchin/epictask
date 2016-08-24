import {debounce} from 'lodash-decorators'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import {Stores} from 'shared/Stores'
import {ActionFactory, Action, ActionReducer} from 'typedux'
import {Dialogs, IssueKey, DataKey, DataRequestIssueListId} from 'shared/Constants'
import {cloneObject, extractError} from 'shared/util/ObjectUtil'
import {Comment} from 'shared/models/Comment'
import {IssueMessage, IssueState, IIssueSort, IIssueFilter} from './IssueState'
import {Issue, IssueStore, TIssueState} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'

import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {
	enabledRepoIdsSelector,
	enabledReposSelector
} from 'shared/actions/repo/RepoSelectors'
import {DataRequest, DataState} from 'shared/actions/data/DataState'
import {
	selectedIssueIdsSelector, selectedIssueSelector,
	selectedIssuesSelector
} from 'shared/actions/issue/IssueSelectors'
import {
	issueModelsSelector, repoModelsSelector, labelModelsSelector,
	milestoneModelsSelector, userModelsSelector
} from 'shared/actions/data/DataSelectors'
import {GitHubClient} from 'shared/GitHubClient'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {addErrorMessage} from 'shared/Toaster'
import {addMessage} from 'shared/Toaster'
import Settings from 'shared/Settings'
import {TIssuePatchMode} from 'shared/actions/issue'
import {Repo} from 'shared/models/Repo'
import {getStoreState} from 'shared/store'

/**
 * Created by jglanz on 5/29/16.
 */


const log = getLogger(__filename)


//const internalIssueSelector = _.memoize((state) => (state.get(IssueKey) as IssueState).internalIssues)

// IMPORTS


const uuid = require('node-uuid')

/**
 * Add transient properties to `Issue`
 * repo, milestones, collaborators
 *
 * @param issue
 * @returns {({}&Issue&{repo: any, milestones: Iterable<number, any>, collaborators: Iterable<number, any>})|any|*}
 * @param repoId
 * @param getState
 */
export function fillIssue(getState: Function, issue: Issue, repoId: number) {
	const stores: Stores = Container.get(Stores)
	
	const
		state = getState(),
		labelModels = labelModelsSelector(state),
		milestoneModels = milestoneModelsSelector(state),
		repoModels = repoModelsSelector(state),
		userModels = userModelsSelector(state)
	//filledAvailRepo = await stores.availableRepo.load(repoId)
	
	return cloneObject(Object.assign({}, issue, {
		repo: repoModels.valueSeq().find(repo => repo.id === repoId),
		milestones: milestoneModels
			.valueSeq()
			.filter(milestone => milestone.repoId === repoId)
			.toArray(),
		
		collaborators: userModels
			.valueSeq()
			.filter(user => user.repoIds.includes(repoId))
			.toArray()
	}))
	
}


function hasEditPermission(issue: Issue) {
	const {repo} = issue
	
	assert(repo, 'can not test permission without repo set on issue')
	
	return (!issue.user || issue.user.id === Settings.user.id || repo.permissions.push)
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
	stores: Stores
	
	@Inject
	uiActions: UIActionFactory
	
	constructor() {
		super(IssueState)
	}
	
	leaf(): string {
		return IssueKey;
	}
	
	@ActionReducer()
	setIssueIds(issueIds: number[]) {
		return (state: IssueState) => {
			let selectedIssueIds = state.selectedIssueIds
			if (selectedIssueIds.length) {
				selectedIssueIds = selectedIssueIds
					.filter(selectedIssueId => (
						issueIds.includes(selectedIssueId)
					))
				
				// if (!selectedIssueIds.length && issueIds.length)
				// 	selectedIssueIds = [issueIds[0]]
			}
			
			let newState = state.set('issueIds', issueIds)
			if (!_.isEqual(selectedIssueIds, state.selectedIssueIds))
				newState = newState.set('selectedIssueIds', selectedIssueIds)
			
			return newState
		}
		
	}
	
	
	requestIssueIdsAction(issueIds: number[], clear: boolean, dispatch, getState) {
		const actions = this.withDispatcher(dispatch, getState)
		//const enabledRepoIds = enabledRepoIdsSelector(getState())
		
		
		// Now push the models into the data state for tracking
		const dataActions = Container.get(DataActionFactory)
		const dataRequest = DataRequest.create(DataRequestIssueListId, false, issueIds, Issue.$$clazz, clear)
		
		actions.setIssueIds(issueIds)
		dataActions.submitRequest(dataRequest)
		
	}
	
	
	/**
	 * Create a new comment
	 */
	newComment() {
		const issue = selectedIssueSelector(getStoreState())
		
		if (!issue) {
			return addErrorMessage('You can only add a comment when an issue is selected')
		}
		
		this.editComment(issue)
	}
	
	/**
	 * Internally change the issue list
	 *
	 * @param issueIds
	 * @param clear
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	private requestIssueIds(issueIds: number[], clear = false) {
		return (dispatch, getState) => this.requestIssueIdsAction(issueIds, clear, dispatch, getState)
	}
	
	
	@ActionReducer()
	private setPatchIssues(issues: Issue[], mode: TIssuePatchMode = null) {
		return (state: IssueState) => state
			.set('patchIssues', issues)
			.set('patchMode', mode || state.patchMode)
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
	setSelectedIssueIds(selectedIssueIds: number[]) {
		return (state: IssueState) => state
			.set('selectedIssueIds', selectedIssueIds)
			.set('editingInline', false)
	}
	
	/**
	 * Start editing an i
	 * @param fromIssue
	 */
	createIssueInline(fromIssue: Issue) {
		this.newIssue(fromIssue, true)
	}
	
	patchIssuesLabel() {
		this.patchIssues('Label')
	}
	
	patchIssuesMilestone() {
		this.patchIssues('Milestone')
	}
	
	patchIssuesAssignee() {
		this.patchIssues('Assignee')
	}
	
	/**
	 * Open issue patch dialog
	 *
	 * @param mode
	 * @param issues
	 */
	patchIssues(mode: TIssuePatchMode, ...issues: Issue[]) {
		const getState = getStoreState
		
		if (!issues || !issues.length)
			issues = selectedIssuesSelector(getState())
		
		if (!issues.length) {
			log.warn('Must have at least 1 issue selected to open patch editor', issues)
			return
		}
		
		const filledIssues = issues.map(issue => fillIssue(getState, issue, issue.repoId))
		
		this.setPatchIssues(filledIssues, mode)
		this.uiActions.setDialogOpen(Dialogs.IssuePatchDialog, true)
	}
	
	/**
	 * Apply patches to issues
	 *
	 * @param patch
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 * @param useAssign
	 */
	@Action()
	applyPatchToIssues(patch: any, useAssign: boolean, ...issues: Issue[]) {
		issues = cloneObject(issues)
		
		return async(dispatch, getState) => {
			if (!issues.length)
				return
			
			
			const originalIssues = cloneObject(issues)
			
			const actions = this.withDispatcher(dispatch, getState)
			const repoModels = repoModelsSelector(getState())
			const client = Container.get(GitHubClient)
			try {
				
				// Filter out issues that the milestone/assignee does not have access to
				if (patch.hasOwnProperty('milestone') && patch.milestone) {
					issues = issues.filter(issue => issue.repoId === patch.milestone.repoId)
				} else if (patch.hasOwnProperty('assignee') && patch.assignee) {
					issues = issues.filter(issue => patch.assignee.repoIds && patch.assignee.repoIds.includes(issue.repoId))
				}
				
				// Now apply the patch to clones
				issues.forEach(issue => {
					const patchCopy = cloneObject(patch)
					
					Object.entries(patch).forEach(([key,val]) => {
						log.info(`Patching key ${key}`)
						
						switch (key) {
							case 'labels':
								issue.labels = !patchCopy.labels ? [] :
									_.uniqBy((issue.labels || [])
										.concat(patchCopy.labels
											.filter(label => label.repoId === issue.repoId)
										)
										, 'url'
									)
								break
							case 'milestone':
								if (!patchCopy.milestone)
									delete issue['milestone']
								else
									issue.milestone = patchCopy.milestone
								break
							case 'assignee':
								if (!patchCopy.assignee)
									delete issue['assignee']
								else
									issue.assignee = patchCopy.assignee
								break
						}
					})
					
					if (!issue.id)
						throw new Error('issue id CANNOT be null')
					
				})
				
				// const issueStore:IssueStore = this.stores.issue
				// One by one update the issues on GitHub
				await Promise.all(issues.map(async(issue: Issue, index) => {
					const repo = issue.repo || repoModels.get(`${issue.repoId}`)
					assert(repo, `Unable to find repo for issue patching: ${issue.repoId}`)
					
					await actions.saveAndUpdateIssueModel(client, repo, issue)
				}))
				
				const issueNumbers = issues.map(issue => '#' + issue.number).join(', ')
				//addMessage(`Saved issues ${issueNumbers}`)
				
				actions.setIssueSaving(false)
				this.uiActions.closeAllDialogs()
				actions.setPatchIssues(null)
				
			} catch (err) {
				log.error('issue patching failed', err, patch, issues, originalIssues)
				actions.setIssueSaving(false, extractError(err))
			}
		}
	}
	
	private async saveAndUpdateIssueModel(client: GitHubClient, repo: Repo, issue: Issue) {
		
		const dataActions: DataActionFactory = Container.get(DataActionFactory)
		
		const issueStore: IssueStore = this.stores.issue
		
		// First save to github
		const
			savedIssue: Issue = await client.issueSave(repo, issue),
			mergedIssue = _.merge({}, issue, savedIssue),
			persistedIssue = await issueStore.save(mergedIssue),
			updatedIssue = _.cloneDeep(persistedIssue),
			reloadedIssue = await issueStore.get(issue.id)
		
		dataActions.updateModels(Issue.$$clazz, {[`${updatedIssue.id}`]: reloadedIssue})
		
		return reloadedIssue
		
	}
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param issue
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	private doIssueSave(issue: Issue) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				dataActions: DataActionFactory = Container.get(DataActionFactory),
				client = Container.get(GitHubClient),
				repoModels = repoModelsSelector(getState()),
				enabledRepoIds = enabledRepoIdsSelector(getState()),
				repo = issue.repo || repoModels.get(`${issue.repoId}`)
			
			try {
				const updatedIssue = await actions.saveAndUpdateIssueModel(client, repo, issue)
				
				// If the issue belongs to an enabled repo then reload issues
				if (enabledRepoIds.includes(updatedIssue.repoId)) {
					let issueIds: number[] = actions.state.issueIds
					if (!issueIds)
						actions.loadIssues()
					else {
						
						if (!issueIds.includes(updatedIssue.id)) {
							issueIds = issueIds.concat(updatedIssue.id)
						}
						
						actions.requestIssueIds(issueIds)
					}
				}
				
				const wasInline = this.state.editingInline
				
				addMessage(`Saved issue #${updatedIssue.number}`)
				
				actions.setSelectedIssueIds([updatedIssue.id])
				actions.setIssueSaving(false)
				actions.setEditingIssue(null)
				
				this.uiActions.closeAllDialogs()
				
				if (wasInline)
					this.uiActions.focusIssuesPanel()
				
			} catch (err) {
				log.error('failed to save issue', err)
				actions.setIssueSaving(false, extractError(err))
			}
		}
	}
	
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param comment
	 */
	
	@Action()
	commentDelete(comment: Comment) {
		return async(dispatch, getState) => {
			assert(comment.issueNumber && comment.repoId, 'Comment issue number and repo id MUST be set')
			
			const
				actions = this.withDispatcher(dispatch, getState),
				dataActions: DataActionFactory = Container.get(DataActionFactory),
				client = Container.get(GitHubClient),
				repoModels = repoModelsSelector(getState()),
				repo = repoModels.get(`${comment.repoId}`),
				commentStore = actions.stores.comment
				
			actions.setIssueSaving(true)
			
			try {
				await client.commentDelete(repo,comment)
				
				// Persist
				await commentStore.remove(comment.id)
				
				// // Update the comment model
				// dataActions.updateModels(Comment.$$clazz,{[`${comment.id}`]:loadedComment})
				
				// Update the comment ids
				const newCommentIds = _.uniq(actions.state.commentIds.filter(commentId => commentId !== `${comment.id}`))
				actions.setCommentIds(newCommentIds)
				
				addMessage(`Removed comment from issue #${comment.issueNumber}`)
				actions.setIssueSaving(false)
				actions.setEditingComment(null)
				
			} catch (err) {
				log.error(`Failed to delete comment`,err)
				actions.setIssueSaving(false,err)
				addErrorMessage(err)
			}
		}
	}
			
			
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param comment
	 */
	@Action()
	private doCommentSave(comment: Comment) {
		return async(dispatch, getState) => {
			assert(comment.issueNumber && comment.repoId, 'Comment issue number and repo id MUST be set')
			
			const
				actions = this.withDispatcher(dispatch, getState),
				dataActions: DataActionFactory = Container.get(DataActionFactory),
				client = Container.get(GitHubClient),
				repoModels = repoModelsSelector(getState()),
				issueModels = issueModelsSelector(getState()),
				issue = issueModels.valueSeq().find(issue =>
				issue.number === comment.issueNumber &&
				issue.repoId === comment.repoId)
			
			assert(issue, `Unable to find issue with repoId = ${comment.repoId} and issueNumber ${comment.issueNumber}`)
			
			const
				repo = issue.repo || repoModels.get(`${issue.repoId}`),
				commentStore = actions.stores.comment
			
			// Clone the comment to not affect UI state and
			// ensure no mutations
			comment = cloneObject(comment)
			
			
			try {
				const
					ghComment = await client.commentSave(repo, issue, comment)
				
				// Assign all the updated from github to the comment
				Object.assign(comment, ghComment, {
					issueNumber: issue.number,
					repoId: repo.id,
					parentRefId: Comment.makeParentRefId(repo.id, issue.number)
				})
				
				// Persist
				await commentStore.save(comment)
				const loadedComment = await commentStore.get(comment.id)
				
				// Update the comment model
				dataActions.updateModels(Comment.$$clazz,{[`${comment.id}`]:loadedComment})
				
				// Update the comment ids
				const newCommentIds = _.uniq(
					(actions.state.commentIds || []).concat(['' + comment.id])
				)
				
				actions.setCommentIds(newCommentIds)
				
				// Tell the user we are good to go!
				addMessage(`Saved comment`)
				actions.setIssueSaving(false)
				actions.setEditingComment(null)
				
				this.uiActions.closeAllDialogs()
				
				await Promise.setImmediate()
				
				const selectedIssue = selectedIssueSelector(getState())
				if (selectedIssue && selectedIssue.id === issue.id)
					actions.loadActivityForIssue(issue.id)
				
				
			} catch (err) {
				log.error('failed to save issue', err)
				actions.setIssueSaving(false, extractError(err))
			}
		}
	}
	
	
	/**
	 * Set issue saving to true/false
	 *
	 * @param saving
	 * @param error
	 * @returns {(state:IssueState)=>Map<string, boolean>}
	 */
	@ActionReducer()
	setIssueSaving(saving: boolean, error: Error = null) {
		return (state: IssueState) => state
			.set('issueSaving', saving)
			.set('issueSaveError', error)
		
	}
	
	
	/**
	 * Create/Update comment
	 *
	 * @param issue
	 * @param comment
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	
	commentSave(comment: Comment) {
		this.setIssueSaving(true)
		this.doCommentSave(comment)
	}
	
	/**
	 * Save an issue, update or create
	 *
	 * @param issue
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	
	issueSave(issue: Issue) {
		this.setIssueSaving(true)
		this.doIssueSave(issue)
	}
	
	/**
	 * Set the current issue being edited
	 *
	 * @param editingIssue
	 * @param inline
	 * @return {(state:IssueState)=>Map<string, Issue>}
	 */
	@ActionReducer()
	setEditingIssue(editingIssue: Issue, inline: boolean = false) {
		return (state: IssueState) => state
			.set('editingIssue', editingIssue).set('editingInline', inline)
	}
	
	/**
	 * Set whether or not inline editing is taking place
	 *
	 * @param inline
	 * @returns {(state:IssueState)=>Map<string, boolean>}
	 */
	@ActionReducer()
	setEditingInline(inline: boolean) {
		return (state: IssueState) => state.set('editingInline', inline)
	}
	
	@ActionReducer()
	editInline(groupIndex: number, issueIndex: number, issue: Issue) {
		return (state: IssueState) => state
			.set('editingInline', true)
			.set('editingIssue', issue)
			.set('editInlineConfig', {
				groupIndex,
				issueIndex,
				issue
			})
		
	}
	
	
	/**
	 * Create a new issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	newIssue(fromIssue: Issue = null, inline: boolean = false) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				uiActions = Container.get(UIActionFactory),
				appActions = Container.get(AppActionFactory),
				dialogName = Dialogs.IssueEditDialog
			
			
			if (this.uiActions.state.dialogs[dialogName]) {
				log.info('Dialog is already open', dialogName)
				return
			}
			
			const state = getState()
			const availRepos = _.sortBy(enabledReposSelector(state), 'name')
			
			// If no from issue was provided then use the selected
			// issue if available - otherewise totally empty
			if (!fromIssue) {
				const selectedIssueIds = selectedIssueIdsSelector(state) || []
				//const availRepoIds = availRepoIdsSelector(state)
				const issueModels = issueModelsSelector(state)
				
				const selectedIssueId = selectedIssueIds.length && `${selectedIssueIds[0]}`
				
				fromIssue =
					(selectedIssueId && issueModels.has(selectedIssueId)) ?
						issueModels.get(selectedIssueId) : null
				
				
			}
			
			let repoId: number = _.get(fromIssue, 'repoId') as any
			if (!availRepos.find(item => item.repoId === repoId))
				repoId = (availRepos.length) ? availRepos[0].repoId : null
			
			if (!repoId) {
				addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}
			
			const issue = fillIssue(getState, new Issue({repoId}), repoId)
			
			if (fromIssue)
				assign(issue, _.cloneDeep(_.pick(fromIssue, 'milestone', 'labels')))
			
			actions.setIssueSaving(false)
			actions.setEditingIssue(issue, inline)
			
			uiActions.setDialogOpen(dialogName, true)
		}
	}
	
	/**
	 * Start editing an issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	editIssue(issue:Issue = null) {
		const
			uiActions = Container.get(UIActionFactory),
			dialogName = Dialogs.IssueEditDialog,
			getState = getStoreState
			
		issue = issue || selectedIssueSelector(getState())
		
		assert(issue, 'You must have an issue selected in order to edit one ;)')
		
		const editingIssue = fillIssue(getState, _.cloneDeep(issue), issue.repoId)
		
		this.setIssueSaving(false)
		this.setEditingIssue(editingIssue)
		uiActions.setDialogOpen(dialogName, true)
	}
	
	/**
	 * Start editing a comment
	 *
	 * @param issue - required, used as the base for 'new comments'
	 * @param comment - if editing, the comment to edit
	 */
	editComment(issue: Issue, comment: Comment = null) {
		const
			uiActions = Container.get(UIActionFactory),
			dialogName = Dialogs.IssueCommentDialog,
			getState = getStoreState
		
		assert(issue, 'You must provide an issue to edit/create a comment ;)')
		
		// Fill the issue
		issue = fillIssue(getState, issue, issue.repoId)
		
		// Get repo ref for creating parent ref id
		const {repo} = issue
		
		if (!comment)
			comment = Object.assign(new Comment(), {
				issueNumber: issue.number,
				parentRefId: Comment.makeParentRefId(repo.id, issue.number),
				repoId: repo.id,
				body: ''
			})
		
		this.setIssueSaving(false)
		this.setEditingComment(comment)
		uiActions.setDialogOpen(dialogName, true)
	}
	
	
	private filteringAndSorting(issueFilter: IIssueFilter = null, issueSort: IIssueSort = null) {
		return (issueState: IssueState, getState) => issueState.withMutations((newIssueState: IssueState) => {
			
			if (issueFilter)
				newIssueState.set('issueFilter', issueFilter)
			
			if (issueSort)
				newIssueState.set('issueSort', issueSort)
			
			return newIssueState
		})
	}
	
	
	/**
	 * Set the group by mode
	 *
	 * @param groupBy
	 */
	setGroupBy(groupBy: string) {
		const
			issueSort = this.state.issueSort,
			newIssueSort: IIssueSort = assign(
				_.cloneDeep(issueSort),
				{groupBy}
			)
		
		this.setFilteringAndSorting(null, newIssueSort)
	}
	
	/**
	 * Toggle ascending and descending grouping
	 */
	toggleGroupByDirection() {
		const
			issueSort = this.state.issueSort,
			newIssueSort: IIssueSort = _.assign(
				_.cloneDeep(issueSort),
				{
					groupByDirection: (issueSort.groupByDirection === 'asc') ?
						'desc' :
						'asc'
				}
			) as any
		
		this.setFilteringAndSorting(null, newIssueSort)
	}
	
	
	/**
	 * Set the sorting field
	 *
	 * @param field
	 */
	setSortByField(field: string) {
		const
			issueSort = this.state.issueSort,
			newIssueSort: IIssueSort = assign(
				_.cloneDeep(issueSort),
				{fields: [field]}
			)
		
		this.setFilteringAndSorting(null, newIssueSort)
	}
	
	/**
	 * Toggle ascending and descending sort
	 */
	toggleSortByDirection() {
		const
			issueSort = this.state.issueSort,
			newIssueSort: IIssueSort = _.assign(
				_.cloneDeep(issueSort),
				{
					direction: (issueSort.direction === 'asc') ?
						'desc' :
						'asc'
				}
			) as any
		
		this.setFilteringAndSorting(null, newIssueSort)
	}
	
	/**
	 * Toggle milestone on issue filter
	 *
	 * @param milestone
	 */
	toggleIssueFilterMilestone(milestone: Milestone) {
		const {issueFilter} = this.state
		const
			newIssueFilter = _.cloneDeep(issueFilter),
			milestoneIds = newIssueFilter.milestoneIds || (newIssueFilter.milestoneIds = []),
			index = milestoneIds.indexOf(milestone.id)
		
		if (index === -1) {
			milestoneIds.push(milestone.id)
		} else {
			milestoneIds.splice(index, 1)
		}
		
		
		this.setFilteringAndSorting(newIssueFilter)
	}
	
	/**
	 * Toggle a label on the issue filter
	 *
	 * @param label
	 */
	toggleIssueFilterLabel(label: Label) {
		const {issueFilter} = this.state
		const
			newIssueFilter = _.cloneDeep(issueFilter),
			labelUrls = newIssueFilter.labelUrls || (newIssueFilter.labelUrls = []),
			index = labelUrls.indexOf(label.url)
		
		if (index === -1) {
			labelUrls.push(label.url)
		} else {
			labelUrls.splice(index, 1)
		}
		
		this.setFilteringAndSorting(newIssueFilter)
	}
	
	/**
	 * Set the current comment ids
	 *
	 * @param commentIds
	 * @returns {(issueState:IssueState)=>Map<string, string[]>}
	 */
	
	@ActionReducer()
	protected setCommentIds(commentIds: string[]) {
		return (issueState: IssueState) => issueState.set('commentIds', commentIds)
	}
	
	/**
	 * Set filtering and sorting
	 *
	 * @param issueFilter
	 * @param issueSort
	 * @returns {(issueState:IssueState, getState:any)=>Map<(value:Map<any, any>)=>Map<any, any>, V>}
	 */
	@ActionReducer()
	setFilteringAndSorting(issueFilter: IIssueFilter = null, issueSort: IIssueSort = null) {
		return this.filteringAndSorting(issueFilter, issueSort)
	}
	
	
	private async loadIssuesAction(dispatch, getState) {
		const
			actions = this.withDispatcher(dispatch, getState),
			dataActions = Container.get(DataActionFactory)
		
		// Issue repo
		const
			issueState = actions.state,
			issueStore = actions.stores.issue,
			issueFilter = issueState.issueFilter
		
		const repoIds = enabledRepoIdsSelector(getState())
		log.info(`Loading issues for repos`, repoIds)
		
		let offset = 0
		const limit = 50
		let labels = await actions.stores.label.findByRepoId(...repoIds)
		let milestones = await actions.stores.milestone.findByRepoId(...repoIds)
		
		let issueIds: number[] = await (issueFilter.includeClosed ?
			issueStore.findIdsByRepoId(...repoIds) :
			issueStore.findIdsByStateAndRepoId('open', ...repoIds))
		
		// while (true) {
		// 	log.info(`Requesting issues page # ${(offset / limit) + 1}`)
		// 	const request = new FinderRequest(limit,offset)
		// 	const moreIssueIds = await issueStore.findByRepoIdWithRequest(request,...repoIds)
		// 	issueIds.push(...moreIssueIds)
		// 	if (moreIssueIds.length === 0 || moreIssueIds.length < limit)
		// 		break
		//
		// 	offset += limit
		//
		// }
		
		const milestoneMap = milestones.reduce((map, nextMilestone) => {
			map['' + nextMilestone.id] = nextMilestone
			return map
		}, {})
		
		const labelMap = labels.reduce((map, nextLabel) => {
			map[nextLabel.url] = nextLabel
			return map
		}, {})
		
		dataActions.updateModels(
			Milestone.$$clazz,
			milestoneMap
		)
		
		dataActions.updateModels(
			Label.$$clazz,
			labelMap
		)
		
		actions.requestIssueIds(issueIds, false)
	}
	
	@Action()
	loadIssues() {
		return (dispatch, getState) => this.loadIssuesAction(dispatch, getState)
	}
	
	@Action()
	clearAndLoadIssues(...repoIds: number[]) {
		return (dispatch, getState) => {
			this.requestIssueIdsAction([], true, dispatch, getState)
			this.loadIssuesAction(dispatch, getState)
		}
	}
	
	
	@Action()
	loadActivityForIssue(issueId: number) {
		return async(dispatch, getState) => {
			const actions = this.withDispatcher(dispatch, getState)
			
			// Issue repo
			const issueState = this.state
			const dataState: DataState = getState().get(DataKey)
			
			let issue: Issue = dataState.models.get(Issue.$$clazz).get(`${issueId}`)
			if (!issue) {
				log.warn(`Issue not found in data state: ${issueId}`)
				issue = await this.stores.issue.get(issueId)
				assert(issue, `Issue still not found ${issueId}`)
			}
			
			
			log.info(`Loading activity for issue `, issueId)
			const comments = await this.stores.comment.findByIssueNumber(issue.repoId, issue.number)
			const commentIds = comments.map(comment => `${comment.id}`)
			const commentMap = _.modelArrayToMapBy(comments, 'id')
			
			log.info(`Loaded ${comments.length} comments`)
			
			// Now push the models into the data state for tracking
			const dataActions = Container.get(DataActionFactory)
			await dataActions.submitRequestAction(
				DataRequest.create(
					'comments-list',
					false,
					commentIds,
					Comment.$$clazz
				),
				commentMap,
				dispatch,
				getState
			)
			
			actions.setCommentIds(commentIds)
			//actions.setFilteringAndSorting()
			
		}
	}
	
	/**
	 * Update the filter to include closed and reload
	 *
	 * @param includeClosed
	 */
	includeClosedIssues(includeClosed: boolean) {
		const updatedFilter = assign(_.cloneDeep(this.state.issueFilter), {includeClosed})
		this.setFilteringAndSorting(updatedFilter)
		this.loadIssues()
		
	}
	
	
	@Action()
	setIssueState(newState: TIssueState, ...issueIds: number[]) {
		return async(dispatch, getState) => {
			let issues = await this.stores.issue.bulkGet(...issueIds)
			log.info(`Going to delete ${issues.length} issues`)
			
			const
				dataActions = Container.get(DataActionFactory),
				client = Container.get(GitHubClient)
			
			
			issues = _.cloneDeep(issues)
			const closeIssues = []
			
			for (let issue of issues) {
				if (!issue.repo)
					issue.repo = await this.stores.repo.get(issue.repoId)
				
				if (!hasEditPermission(issue))
					addErrorMessage(`You don't have permission to close this issue: ${issue.number}`)
				else
					closeIssues.push(issue)
			}
			
			const promises = closeIssues
			// .filter((issue:Issue) => issue.state !== newState)
				.map(async(issue: Issue) => {
					issue.state = newState
					let mergedIssue = null,
						persistedIssue = null,
						resultIssue = null
					try {
						assert(issue.repo, 'repo not found for issue: ' + issue.repoId)
						
						
						resultIssue = await client.issueSave(issue.repo, issue)
						log.info(`Got result issue from github, new state is ${resultIssue.state}`)
						
						// Get the issue in case it changed along the way
						issue = await this.stores.issue.get(issue.id)
						mergedIssue = _.merge({}, issue, resultIssue)
						
						await Promise.delay(1)
						persistedIssue = await this.stores.issue.save(mergedIssue)
						
						// Update in data models (memory/state)
						dataActions.updateModels(Issue.$$clazz, {[`${persistedIssue.id}`]: persistedIssue})
						
						// Remove from selected if selected
						return mergedIssue
					} catch (err) {
						log.error('set issue state failed', err)
						addErrorMessage(`Unable set set issue state for #${issue.number}: ${err.message}`)
					}
				})
			
			const results = await Promise.all(promises)
			
			addMessage(`Closed ${results.length} issues successfully`)
			
			this.loadIssuesAction(dispatch, getState)
			
		}
		
	}
	
	/**
	 * Set the comment being edited
	 *
	 * @param comment
	 */
	@ActionReducer()
	setEditingComment(comment: Comment) {
		return (state: IssueState, getState) => state.set('editingComment', comment)
	}
}


export default IssueActionFactory
