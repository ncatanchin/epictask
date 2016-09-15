
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import { Stores, getStores } from 'shared/Stores'
import {ActionFactory, Action, ActionReducer} from 'typedux'
import {Dialogs, IssueKey} from 'shared/Constants'
import {cloneObject, extractError} from 'shared/util/ObjectUtil'
import {Comment} from 'shared/models/Comment'
import {
	IssueMessage, IssueState, IIssueSort, IIssueFilter, TIssueSortAndFilter,
	TEditCommentRequest
} from './IssueState'
import {Issue, IssueStore, TIssueState} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {
	enabledRepoIdsSelector, availableRepoIdsSelector, enabledAvailReposSelector
} from 'shared/actions/repo/RepoSelectors'

import {
	selectedIssueIdsSelector, issueSortAndFilterSelector, issuesSelector, selectedIssueIdSelector, selectedIssueSelector
} from 'shared/actions/issue/IssueSelectors'
import {GitHubClient} from 'shared/GitHubClient'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {addErrorMessage} from 'shared/Toaster'
import {addMessage} from 'shared/Toaster'
import {getSettings} from 'shared/Settings'
import {TIssuePatchMode} from 'shared/actions/issue/IssueState'
import {Repo} from 'shared/models/Repo'
import {getStoreState} from 'shared/store'
import {Provided} from 'shared/util/ProxyProvided'
import { User, AvailableRepo } from "shared/models"
import { RegisterActionFactory } from "shared/Registry"

/**
 * Created by jglanz on 5/29/16.
 */

const
	log = getLogger(__filename)


/**
 * User has permission to edit issue
 *
 * @param issue
 * @returns {boolean}
 */
export function hasEditPermission(issue: Issue) {
	const {repo} = issue
	
	assert(repo, 'can not test permission without repo set on issue')
	
	return (!issue.user || issue.user.id === getSettings().user.id || repo.permissions.push)
}


/**
 * Issue data update shape
 *
 */

export interface IIssueDataUpdate {
	issueIds?:number[]
	commentIds?:number[]
	labelUrls?:string[]
	milestoneIds?:number[]
}


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@RegisterActionFactory
@Provided
export class IssueActionFactory extends ActionFactory<IssueState,IssueMessage> {
	
	static leaf = IssueKey
	
	stores: Stores
	
	uiActions: UIActionFactory
	
	constructor() {
		super(IssueState)
		
		this.stores = Container.get(Stores)
		this.uiActions = Container.get(UIActionFactory)
	}
	
	leaf(): string {
		return IssueKey;
	}
	
	// @ActionReducer()
	// setIssueIds(issueIds: number[]) {
	// 	return (state: IssueState) => {
	// 		let selectedIssueIds = state.selectedIssueIds
	// 		if (selectedIssueIds.length) {
	// 			selectedIssueIds = selectedIssueIds
	// 				.filter(selectedIssueId => (
	// 					issueIds.includes(selectedIssueId)
	// 				))
	//
	// 			// if (!selectedIssueIds.length && issueIds.length)
	// 			// 	selectedIssueIds = [issueIds[0]]
	// 		}
	//
	// 		let newState = state.set('issueIds', issueIds)
	// 		if (!_.isEqual(selectedIssueIds, state.selectedIssueIds))
	// 			newState = newState.set('selectedIssueIds', selectedIssueIds)
	//
	// 		return newState
	// 	}
	//
	// }
	
	
	
	/**
	 * Create a new comment
	 */
	newComment() {
		const
			issue = selectedIssueSelector(getStoreState())
		
		if (!issue) {
			return addErrorMessage('You can only add a comment when exactly one issue is selected')
		}
		
		this.editComment(issue)
	}
	
	
	@ActionReducer()
	private setIssues(issues:Issue[]) {
		return (issueState:IssueState) => issueState.set('issues',cloneObject(issues))
	}
	
	@Action()
	loadIssues() {
		return async (dispatch,getState) => {
			const
				enabledRepos = enabledAvailReposSelector(getState()),
				issues = await this.getIssues(enabledRepos)
			
			this.setIssues(issues)
		}
	}
	
	/**
	 * Get issues for a set of available repos
	 *
	 * @param availRepos
	 * @returns {Promise<Issue[]>}
	 */
	
	async getIssues(availRepos:AvailableRepo[]) {
		
		availRepos = _.nilFilter(availRepos)
		
		let
			issues = await Container.get(Stores)
				.issue
				.findByRepoId(...availRepos.map(availRepo => availRepo.repoId))
		
		issues = issues
			.filter(issue => {
				const
					availRepo = availRepos.find(availRepo => availRepo.repoId === issue.repoId)
				
				return availRepo && availRepo.repoId
			})
			.map(issue => {
				const
					availRepo = availRepos.find(availRepo => availRepo.repoId === issue.repoId),
					repo = availRepo.repo
					
				
				return cloneObject(issue,{
					repo,
					collaborators: availRepo.collaborators,
					labels: !issue.labels ? [] : issue.labels.map(label => availRepo.labels.find(it => it.url === label.url)),
					milestone: issue.milestone && availRepo.milestones.find(it => it.id === issue.milestone.id)
				})
			})
		
		
		return issues
		
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
	async patchIssues(mode: TIssuePatchMode, ...issues: Issue[]) {
		const getState = getStoreState
		
		if (!issues || !issues.length) {
			issues = await Container.get(Stores).issue
				.bulkGet(...selectedIssueIdsSelector(getState()))
		}
		
		if (!issues.length) {
			log.warn('Must have at least 1 issue selected to open patch editor', issues)
			return
		}
		
		// TODO: issues.map(issue => fillIssue(getState, issue, issue.repoId))
		const filledIssues = issues
		
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
			
			
			const
				originalIssues = cloneObject(issues),
				stores = Container.get(Stores),
				actions = this.withDispatcher(dispatch, getState),
				client = Container.get(GitHubClient)
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
					const repo = issue.repo || await stores.repo.get(issue.repoId)
					assert(repo, `Unable to find repo for issue patching: ${issue.repoId}`)
					
					await actions.saveAndUpdateIssueModel(client, repo, issue)
				}))
				
				//const issueNumbers = issues.map(issue => '#' + issue.number).join(', ')
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
		
		const issueStore: IssueStore = this.stores.issue
		
		// First save to github
		const
			savedIssue: Issue = await client.issueSave(repo, issue),
			mergedIssue = _.merge({}, issue, savedIssue),
			persistedIssue = await issueStore.save(mergedIssue),
			updatedIssue = _.cloneDeep(persistedIssue),
			reloadedIssue = await issueStore.get(issue.id)
		
		// TODO: Notify of data update
		//dataActions.updateModels(Issue.$$clazz, {[`${updatedIssue.id}`]: reloadedIssue})
		
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
				client = Container.get(GitHubClient),
				stores = Container.get(Stores),
				enabledRepoIds = enabledRepoIdsSelector(getState()),
				repo = issue.repo || await stores.repo.get(issue.repoId)
			
			try {
				const updatedIssue = await actions.saveAndUpdateIssueModel(client, repo, issue)
				
				// If the issue belongs to an enabled repo then reload issues
				if (enabledRepoIds.includes(updatedIssue.repoId)) {
					//TODO: Notify issue update
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
				client = Container.get(GitHubClient),
				stores = Container.get(Stores),
				repo = await stores.repo.get(comment.repoId),
				commentStore = actions.stores.comment
				
			actions.setIssueSaving(true)
			
			try {
				await client.commentDelete(repo,comment)
				
				// Persist
				await commentStore.remove(comment.id)
				
				// // Update the comment model
				// dataActions.updateModels(Comment.$$clazz,{[`${comment.id}`]:loadedComment})
				
				// Update the comment ids
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
	 * @param editCommentRequest
	 */
	@Action()
	private doCommentSave(editCommentRequest: TEditCommentRequest) {
		
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState)
				
			let
				{comment,issue} = editCommentRequest
			
			try {
				assert(comment.issueNumber && comment.repoId, 'Comment issue number and repo id MUST be set')
				
				const
					client = Container.get(GitHubClient),
					stores = Container.get(Stores),
					{issue:issueStore,repo:repoStore} = stores
				
				assert(issue, `Unable to find issue with repoId = ${comment.repoId} and issueNumber ${comment.issueNumber}`)
				
				const
					repo = issue.repo || await repoStore.get(issue.repoId),
					commentStore = actions.stores.comment
				
				// Clone the comment to not affect UI state and
				// ensure no mutations
				comment = cloneObject(comment)
				
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
				//const loadedComment = await commentStore.get(comment.id)
				
				// Update the comment model
				//TODO: Notify issue update
				//dataActions.updateModels(Comment.$$clazz,{[`${comment.id}`]:loadedComment})
				
				
				// Tell the user we are good to go!
				addMessage(`Saved comment`)
				actions.setIssueSaving(false)
				actions.setEditingComment(null)
				
				this.uiActions.closeAllDialogs()
				
				await Promise.setImmediate()
				
				const
					selectedIssueId = this.state.selectedIssueIds[0],
					selectedIssue = selectedIssueId && await issueStore.get(selectedIssueId)
				
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
	 * @param editCommentRequest
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	
	commentSave(editCommentRequest:TEditCommentRequest) {
		
		this.setIssueSaving(true)
		this.doCommentSave(editCommentRequest)
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
	editInline(issueIndex: number, issue: Issue) {
		return (state: IssueState) => state
			.set('editingInline', true)
			.set('editingIssue', issue)
			.set('editInlineConfig', {
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
				{issue:issueStore,availableRepo:availRepoStore} = Container.get(Stores),
				dialogName = Dialogs.IssueEditDialog
			
			
			if (this.uiActions.state.dialogs[dialogName]) {
				log.info('Dialog is already open', dialogName)
				return
			}
			
			const state = getState()
			const
				availRepoIds = availableRepoIdsSelector(state),
				availRepos = _.sortBy(await availRepoStore.bulkGet(...availRepoIds), 'name')
			
			// If no from issue was provided then use the selected
			// issue if available - otherwise totally empty
			if (!fromIssue) {
				const
					selectedIssueIds = selectedIssueIdsSelector(state) || [],
					selectedIssueId = selectedIssueIds.length && `${selectedIssueIds[0]}`
				
				if (selectedIssueId)
					fromIssue = await issueStore.get(selectedIssueId)
				else
					fromIssue = null
			}
			
			let repoId: number = _.get(fromIssue, 'repoId') as any
			
			if (!availRepos.find(item => item.repoId === repoId))
				repoId = (availRepos.length) ? availRepos[0].repoId : null
			
			if (!repoId) {
				addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}
			
			// TODO: Issue fill
			//fillIssue(getState, , repoId)
			const issue = new Issue({repoId})
			
			if (fromIssue)
				assign(issue, _.cloneDeep(_.pick(fromIssue, 'milestone', 'labels')))
			
			actions.setIssueSaving(false)
			actions.setEditingIssue(issue, inline)
			
			uiActions.setDialogOpen(dialogName, true)
		}
	}
	
	getSelectedIssue():Issue {
		return selectedIssueSelector(getStoreState())
	}
	
	/**
	 * Start editing an issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	async editIssue(issue:Issue = null) {
		const
			uiActions = Container.get(UIActionFactory),
			dialogName = Dialogs.IssueEditDialog,
			getState = getStoreState
			
		issue = issue || await this.getSelectedIssue()
		
		assert(issue, 'You must have an issue selected in order to edit one ;)')
		
		// TODO: fix issue fill
		const editingIssue = _.cloneDeep(issue) // fillIssue(getState, _.cloneDeep(issue), issue.repoId)
		
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
	async editComment(issue: Issue, comment: Comment = null) {
		const
			uiActions = Container.get(UIActionFactory),
			dialogName = Dialogs.IssueCommentDialog,
			getState = getStoreState
		
		assert(issue, 'You must provide an issue to edit/create a comment ;)')
		
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
		this.setEditingComment({issue,comment})
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
	
	
	/**
	 * Load all issues for enabled repos
	 *
	 * @param dispatch
	 * @param getState
	 * @returns {number[]}
	 */
	async loadIssuesAction(dispatch, getState) {
		const
			actions = this.withDispatcher(dispatch, getState)
		
		// Issue repo
		const
			issueState = actions.state,
			issueStore = actions.stores.issue,
			issueFilter = issueState.issueFilter,
			availRepos = enabledAvailReposSelector(getState),
			repoIds = availRepos.map(availRepo => availRepo.repoId)
		
		log.info(`Loading issues for repos`, repoIds)
		
		this.setIssues(await this.getIssues(enabledAvailReposSelector(getState())))
		
	}
	
	//
	// @Action()
	// loadIssues() {
	// 	return (dispatch, getState) => this.loadIssuesAction(dispatch, getState)
	// }
	
	@Action()
	clearAndLoadIssues(...repoIds: number[]) {
		return (dispatch, getState) => {
			// this.requestIssueIdsAction([], true, dispatch, getState)
			// this.loadIssuesAction(dispatch, getState)
		}
	}
	
	
	/**
	 * Set all activity - add pull requests, etc
	 *
	 * @param comments
	 */
	@ActionReducer()
	private setActivity(comments:Comment[]) {
		return (state:IssueState) =>
			state.set('comments',comments)
	}
	
	/**
	 * Get all activity for an issue
	 *
	 * @param issue
	 * @returns {{comments: any}}
	 */
	async getActivity(issue:Issue) {
		const
			comments = await getStores().comment.findByIssueNumber(issue.repoId, issue.number)
		
		
		return {
			comments: _.orderBy(_.uniqBy(comments,['id']),['created_at'],['desc'])
		}
		
	}
	
	@Action()
	loadActivityForIssue(issueId: number) {
		return async(dispatch, getState) => {
			
			// Issue repo
			let
				issues:Issue[] = issuesSelector(getState())
			
			//log.info(`Loading issue activity`,issues,issueId)
			if (!Array.isArray(issues))
				return
			
			let
				issue: Issue = issues.find(issue => issue.id === issueId)
			
			if (!issue) {
				log.error(`Issue not found in state: ${issueId}`)
				//assert(issue, `Issue still not found in state ${issueId}`)
				return
			}
			
			
			
			const
				{comments} = await this.getActivity(issue)
			
			log.info(`Loading activity for issue `, issueId,comments)
			this.setActivity(comments)
			// TODO: Activity load
			// Now push the models into the data state for tracking
			// const dataActions = Container.get(DataActionFactory)
			// await dataActions.submitRequestAction(
			// 	DataRequest.create(
			// 		'comments-list',
			// 		false,
			// 		commentIds,
			// 		Comment.$$clazz
			// 	),
			// 	commentMap,
			// 	dispatch,
			// 	getState
			// )
			//
			
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
	}
	
	
	@Action()
	setIssueState(newState: TIssueState, ...issueIds: number[]) {
		return async(dispatch, getState) => {
			let issues = await this.stores.issue.bulkGet(...issueIds)
			log.info(`Going to delete ${issues.length} issues`)
			
			const
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
						// TODO: Notify update
						//dataActions.updateModels(Issue.$$clazz, {[`${persistedIssue.id}`]: persistedIssue})
						
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
	 * @param editCommentRequest
	 */
	@ActionReducer()
	setEditingComment(editCommentRequest: TEditCommentRequest) {
		return (state: IssueState, getState) => state.set('editCommentRequest', editCommentRequest)
	}
}


export default IssueActionFactory
