
import {FinderRequest} from 'typestore'
import {ActionFactory, ActionThunk, ActionReducer} from 'typedux'
import {List} from 'immutable'

import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import { Stores, getStores } from 'shared/Stores'
import { Dialogs, IssueKey, FinderItemsPerPage } from 'shared/Constants'
import { cloneObject, extractError, isNil, nilFilter, isNumber } from 'shared/util/ObjectUtil'
import {Comment} from 'shared/models/Comment'
import {
	IssueMessage, IssueState, TIssueSortAndFilter,
	TEditCommentRequest, IIssuePatchLabel
} from './IssueState'
import {Issue, IssueStore, TIssueState} from 'shared/models/Issue'
import {AppActionFactory} from '../app/AppActionFactory'
import {
	enabledRepoIdsSelector, availableRepoIdsSelector, enabledAvailableReposSelector, availableReposSelector
} from 'shared/actions/repo/RepoSelectors'

import {
	selectedIssueIdsSelector, issueSortAndFilterSelector, issuesSelector, selectedIssueIdSelector, selectedIssueSelector,
	selectedIssuesSelector, issueItemsSelector
} from 'shared/actions/issue/IssueSelectors'
import {GitHubClient} from 'shared/GitHubClient'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {addErrorMessage} from 'shared/Toaster'
import {addMessage} from 'shared/Toaster'
import {getSettings} from 'shared/settings/Settings'
import {TIssuePatchMode} from 'shared/actions/issue/IssueState'
import {Repo} from 'shared/models/Repo'
import {getStoreState} from 'shared/store'
import {Provided} from 'shared/util/ProxyProvided'
import { User, AvailableRepo, CommentStore, IssuesEvent, IssuesEventStore } from "shared/models"
import { RegisterActionFactory } from "shared/Registry"
import { pagedFinder } from "shared/util/RepoUtils"
import { IIssueFilter } from "shared/actions/issue/IIssueFilter"
import { IIssueSort } from "shared/actions/issue/IIssueSort"
import { isListType } from "shared/util/ObjectUtil"
import { ISyncChanges } from "shared/actions/repo/RepoActionFactory"
import { RepoSyncManager } from "shared/github/GithubEventHandlers"
import { getGithubEventMonitor } from "shared/github/GithubEventMonitor"
import { ContainerNames } from "shared/UIConstants"


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
	private setIssues(issues:List<Issue>) {
		return (issueState:IssueState) =>
			issueState
				.set('issues',issues)
	}
	
	@ActionThunk()
	loadIssues() {
		return async (dispatch,getState) => {
			const
				enabledRepos = enabledAvailableReposSelector(getState())
			
			let
				issues
			
			if (!enabledRepos || enabledRepos.size === 0) {
				log.warn(`No enabled repos found, can not load issues`)
				issues = List<Issue>()
			} else {
				issues = await this.getIssues(enabledRepos.toArray())
				log.debug(`Loaded issues`,issues)
			}
			
			const
				selectedIssueIds = selectedIssueIdsSelector(getState())
			
			// SET ISSUES
			this.setIssues(issues)
			
			// IFF SELECTED ISSUE THEN LOAD ACTIVITY
			if (selectedIssueIds && selectedIssueIds.length === 1) {
				this.loadActivityForIssue(selectedIssueIds[0])
			}
			
			
		}
	}
	
	/**
	 * Get issues for a set of available repos
	 *
	 * @param availRepos
	 * @param fromIssues
	 * @returns {Promise<Issue[]>}
	 */
	
	async getIssues(availRepos:List<AvailableRepo>|AvailableRepo[],fromIssues:Issue[] = null):Promise<List<Issue>> {
		
		if (isListType(availRepos,AvailableRepo))
			availRepos = availRepos.toArray()
		
		log.debug(`Getting issues for avail repos`,availRepos)
		
		availRepos = _.nilFilter(availRepos) as AvailableRepo[]
		
		let
			issues = List<Issue>()
		
		if (fromIssues && fromIssues.length) {
			issues = issues.push(...fromIssues)
		} else {
			
			await Promise.all(availRepos.map(async(availRepo) => {
				const repoIssues:List<Issue> = await pagedFinder(
					Issue,
					FinderItemsPerPage,
					getStores().issue,
					(issueStore:IssueStore, nextRequest:FinderRequest) =>
						issueStore.findByIssuePrefix(nextRequest, availRepo.repoId)
				)
				
				
				issues = issues.concat(repoIssues) as List<Issue>
			}))
		}
			
		issues = issues
			.filter(issue => {
				const hasRepoId = issue && !!issue.repoId
				
				if (!hasRepoId) {
					log.warn(`Issue does not have repoId`,issue)
				}
				
				return hasRepoId
			})
			.map(issue => {
				const
					availRepo = (availRepos as AvailableRepo[])
						.find(availRepo => availRepo.repoId === issue.repoId),
					repo = availRepo.repo
					
				
				return cloneObject(issue,{
					repo,
					collaborators: availRepo.collaborators,
					
					// Find labels
					labels: !issue.labels ? [] :
						issue.labels.map(label =>
							availRepo.labels.find(it => it.url === label.url) || label),
					
					// Find milestones
					milestone: (issue.milestone &&
						availRepo.milestones.find(it => it.id === issue.milestone.id)) || issue.milestone
				})
			}) as List<Issue>
		
		
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
			log.debug(`no issues passed to patch, going to use the selected issues`)
			issues = selectedIssuesSelector(getState())
		}
		
		if (!issues.length) {
			log.warn('Must have at least 1 issue selected to open patch editor', issues)
			return
		}
		
		this.setPatchIssues(issues, mode)
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
	@ActionThunk()
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
					const
						patchCopy = cloneObject(patch)
					
					Object.entries(patch).forEach(([key,val]) => {
						log.debug(`Patching key ${key}`,patch[key])
						
						switch (key) {
							case 'labels':
								patchCopy.labels = _.nilFilter(patchCopy.labels)
								
								if (!patchCopy.labels || !patchCopy.labels.length) {
									issue.labels = []
									break
								}
								
								const
									addLabels = patchCopy.labels
										.filter(({action}:IIssuePatchLabel) => action === 'add')
										.map(({label}:IIssuePatchLabel) => label),
									
									removeLabelUrls = patchCopy.labels
										.filter(({action}:IIssuePatchLabel) => action === 'remove')
										.map(({label}:IIssuePatchLabel) => label.url)
								
								
								// Add new labels and filter out old ones
								issue.labels = _.uniqBy((issue.labels || [])
										.concat(addLabels
											.filter(label => label && label.repoId === issue.repoId)
										)
										, 'url'
									).filter(label => label && !removeLabelUrls.includes(label.url))
								
								log.debug(`Patching labels, adding`,addLabels,`Removing urls`,removeLabelUrls,'updated issue',issue)
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
					const
						repo = issue.repo || await stores.repo.get(issue.repoId)
					
					assert(repo, `Unable to find repo for issue patching: ${issue.repoId}`)
					
					await actions.saveAndUpdateIssueModel(client, repo, issue)
				}))
				
				actions.setIssueSaving(false)
				this.uiActions.closeAllDialogs()
				actions.setPatchIssues(null)
				
			} catch (err) {
				log.error('issue patching failed', err, patch, issues, originalIssues)
				actions.setIssueSaving(false, extractError(err))
			}
		}
	}
	
	/**
	 * Persist issue to github
	 *
	 * @param client
	 * @param repo
	 * @param issue
	 * @returns {Issue}
	 */
	private async saveAndUpdateIssueModel(client: GitHubClient, repo: Repo, issue: Issue) {
		
		issue = cloneObject(issue)
		
		const
			issueStore: IssueStore = this.stores.issue
			
		// Because our object could be
		// behind the persistent rev,
		// lets update it first
		// TODO: HACKISH - investigate
		if (issue['$$doc']) {
			delete issue['$$doc']
			
			const
				existingIssue = await issueStore.get(Issue.makeIssueId(issue))
			
			if (existingIssue)
				issue['$$doc'] = existingIssue['$$doc']
		}
		
		// First save to github
		const
			savedIssue:Issue = await client.issueSave(repo, issue),
			mergedIssue = _.merge({}, issue, savedIssue)
		
		log.debug(`Issue save, our version`,issue,'github version',savedIssue,'merged version',mergedIssue)
		
		await issueStore.save(mergedIssue)
		
		const
			loadedIssue = await issueStore.get(Issue.makeIssueId(mergedIssue))
		
		// SYNC ISSUE EVENTS
		getGithubEventMonitor().forcePolling(repo.id)
		//RepoSyncManager.get(repo).syncIssues(getStores(),repo)
		
		log.debug(`Updating issue in state`,loadedIssue)
		this.reloadIssues(loadedIssue)
			
		return  loadedIssue
		
	}
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param issue
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	private doIssueSave(issue: Issue) {
		return async(dispatch, getState) => {
			const
				client = Container.get(GitHubClient),
				stores = Container.get(Stores),
				repo = issue.repo || await stores.repo.get(issue.repoId)
			
			try {
				const
					updatedIssue = await this.saveAndUpdateIssueModel(client, repo, issue),
					wasInline = this.state.editingInline
				
				addMessage(`Saved issue #${updatedIssue.number}`)
				
				this.setSelectedIssueIds([updatedIssue.id])
				this.setIssueSaving(false)
				this.setEditingIssue(null)
				this.uiActions.closeAllDialogs()
				
				if (wasInline)
					getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
					
				
			} catch (err) {
				log.error('failed to save issue', err)
				this.setIssueSaving(false, extractError(err))
			}
		}
	}
	
	
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param comment
	 */
	
	@ActionThunk()
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
				try {
					await client.commentDelete(repo,comment)
				} catch (err) {
					if (_.get(err,'statusCode') !== 404)
						throw err
					
					log.warn(`Issue was already removed from GitHub`)
				}
				
				// PERSIST
				await commentStore.remove(Comment.makeCommentId(comment))
				
				// REMOVE FROM STATE IF IN CURRENT COMMENTS
				this.updateCommentsInState(List<Comment>([comment]),true)
				
				
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
	 * Update / create the comment in GitHub, persist and update state
	 *
	 * @param client
	 * @param repo
	 * @param issue
	 * @param comment
	 */
	private async saveAndUpdateComment(client,repo:Repo,issue:Issue,comment:Comment) {
		comment = cloneObject(comment)
		
		const
			commentStore = getStores().comment,
			ghComment = await client.commentSave(repo, issue, comment)
		
		// Assign all the updated from github to the comment
		Object.assign(comment, ghComment, {
			issueNumber: issue.number,
			repoId: repo.id,
			parentRefId: Comment.makeParentRefId(repo.id, issue.number)
		})
		
		const
			commentId = Comment.makeCommentId(comment),
			existingComment = comment.id && (await commentStore.get(commentId))
		
		if (existingComment)
			comment = cloneObject(existingComment,comment)
		
		// Persist
		await commentStore.save(comment)
		
		// Reload to make sure we're good
		comment = await commentStore.get(commentId)
		assert(comment,`Persist was successful, but query for ${commentId} failed - ???`)
		
		const
			currentComments = this.state.comments,
			selectedIssue = selectedIssueSelector(getStoreState())
		
		// UPDATE STATE IF THE COMMENT SHOULD BE VISIBLE
		if (currentComments && currentComments.find(it => it && it.id === comment.id) ||
			(selectedIssue && selectedIssue.id) === issue.id) {
			
			const
				commentIndex = currentComments.findIndex(it => it && it.id === comment.id)
			
			this.updateCommentsInState(commentIndex > -1 ?
				currentComments.set(commentIndex,comment) :
				currentComments.push(comment)
			)
		}
		return comment
		
		
	}
			
	/**
	 * Save an issue and update it in GitHub
	 *
	 * @param editCommentRequest
	 */
	@ActionThunk()
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
					{issue:issueStore} = stores
				
				assert(issue, `Unable to find issue with repoId = ${comment.repoId} and issueNumber ${comment.issueNumber}`)
				
				const
					availRepo = availableReposSelector(getState()).find(it => it.repoId === issue.repoId),
					repo = availRepo && availRepo.repo
				
				
				log.debug(`Got repo`,repo,`for issue`,issue,`for comment`,comment)
				assert(repo,`Unable to get repo from repoId on issue: ${issue.repoId}`)
				
				// Clone the comment to not affect UI state and
				// ensure no mutations
				comment = await this.saveAndUpdateComment(client,repo,issue,comment)
				
				
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
		return (state: IssueState) => {
			state = state.set('editingInline', inline) as any
			
			return (inline) ?
				state :
				state
					.set('editInlineConfig', null)
					.set('editingIssue',null)
			
				
		}
	}
	
	
	@ActionReducer()
	private startEditInline(issue:Issue,fromIssueId,index:number) {
		return (state:IssueState) => state
			.set('editingInline', true)
			.set('editingIssue', issue)
			.set('editInlineConfig', {
				index,
				fromIssueId
			})
	}
	
	@ActionThunk()
	editInline() {
		return (dispatch,getState) => {
			let
				items = issueItemsSelector(getState()),
				selectedIssue = selectedIssueSelector(getState()),
				index = selectedIssue && items.findIndex(item => item.id === selectedIssue.id)
			
			
			if (!selectedIssue || isNil(index) || index === -1) {
				log.warn('Issue index not found',index)
				return
			}
			
			// Increment here to show the create below the current issue
			index++
			
			const
				newIssue = new Issue(_.cloneDeep(_.pick(
					selectedIssue,
					'repoId',
					'milestone',
					'labels',
					'assignee',
					'collaborators'
				)))
			
			this.startEditInline(newIssue,selectedIssue.id,index)
		}
		
	}
	
	
	/**
	 * Create a new issue
	 *
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	newIssue(fromIssue: Issue = null, inline: boolean = false) {
		return async(dispatch, getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				uiActions = Container.get(UIActionFactory),
				appActions = Container.get(AppActionFactory),
				{issue:issueStore,availableRepo:availRepoStore} = Container.get(Stores),
				dialogName = Dialogs.IssueEditDialog
			
			
			if (this.uiActions.state.dialogs[dialogName]) {
				log.debug('Dialog is already open', dialogName)
				return
			}
			
			
			const
				availRepoIds = availableRepoIdsSelector(getState()),
				availRepos = _.sortBy(await availRepoStore.bulkGet(...availRepoIds.toArray()), 'name')
			
			// If no from issue was provided then use the selected
			// issue if available - otherwise totally empty
			if (!fromIssue) {
				const
					selectedIssueIds = selectedIssueIdsSelector(getState()) || [],
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
	
	
	@ActionReducer()
	private filteringAndSorting(issueFilter: IIssueFilter = null, issueSort: IIssueSort = null) {
		return (issueState: IssueState) => issueState.withMutations((newIssueState: IssueState) => {
			
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
	
	@ActionThunk()
	onSyncChanges(changes:ISyncChanges) {
		return async (dispatch,getState) => {
			log.debug(`Received repo sync changes`,changes)
			
			const
				issueNumbers = _.nilFilter([...(changes.issueNumbersChanged || []),...(changes.issueNumbersNew || [])])
			
			if (issueNumbers.length) {
				log.debug(`Issues have been updated during sync `,...issueNumbers)
				
				const
					issueIds = issueNumbers.map(issueNumber => Issue.makeIssueId(changes.repoId,issueNumber))
				
				log.debug(`Mapped numbers to ids`,issueIds)
				
				const
					issueSort = this.state.issueSort,
					fromIssues = await getStores().issue.bulkGet(...issueIds),
					issues = await this.getIssues(availableReposSelector(getState()),fromIssues),
					selectedIssueId = selectedIssueIdSelector(getState())
				
				
				this.updateIssuesInState(issues)
				
				if (selectedIssueId && issueIds.includes(selectedIssueId)) {
					log.debug(`Selected issue has been updated - reloading it's activity`)
					this.loadActivityForIssue(selectedIssueId)
				}
				
			}
				
		}
	}
	
	/**
	 * Update a list of issues in the current state
	 *
	 * @param updatedIssues
	 * @returns {(state:IssueState)=>Map<K, V>}
	 */
	@ActionReducer()
	private updateIssuesInState(updatedIssues:List<Issue>) {
		return (state:IssueState) => state.withMutations((newState:IssueState) => {
			let
				{issues} = newState
			
			updatedIssues.forEach(updatedIssue => {
				const
					issueIndex = issues.findIndex(issue => issue.id === updatedIssue.id)
				
				issues = (issueIndex > -1) ?
					issues.set(issueIndex,updatedIssue) :
					issues.push(updatedIssue)
			})
			
			return newState.set('issues',issues)
		})
	}
	
	@ActionReducer()
	private updateCommentsInState(updatedComments:List<Comment>,remove = false) {
		return (state:IssueState) => {
			let
				{comments} = state
			
			updatedComments.forEach(updatedComment => {
				const
					commentIndex = comments.findIndex(it => it && updatedComment && it.id === updatedComment.id)
				
				// REMOVE COMMENT
				if (remove) {
					if (commentIndex === -1) {
						log.debug(`Comment is not in state, can not remove`, updatedComment)
					} else {
						comments = comments.remove(commentIndex)
					}
				}
				
				// UPDATE & ADD COMMENT
				else {
					if (commentIndex > -1)
						comments = comments.set(commentIndex, updatedComment)
					else {
						
						// CHECK TO SEE IF A NEW ISSUE WAS ADDED TO THE CURRENT ISSUE
						const
							selectedIssue = selectedIssueSelector(getStoreState())
						
						// COMMENT ADD TO CURRENT SELECTED ISSUE
						if (
							selectedIssue &&
							selectedIssue.number === updatedComment.issueNumber &&
							updatedComment.repoId === selectedIssue.repoId
						)
							comments = comments.push(updatedComment)
					}
				}
			})
			 
			return (comments === state.comments) ?
				state :
				state.set('comments',comments)
				
		}
	}
	@ActionThunk()
	commentsChanged(...comments:Comment[]) {
		return async (dispatch,getState) => {
			this.updateCommentsInState(List<Comment>().push(...comments))
			//
			// let
			// 	{comments} = this.state
			//
			// for (let commentId of commentIds) {
			//
			// }
			// commentIds.forEach(commentId => {
			// 	const
			// 		commentIndex = comments.findIndex(comment => comment && comment.id === commentId)
			//
			//
			// })
			//
			// state.set
		}
	}
	
	@ActionReducer()
	toggleGroupVisibility(id:string,visible:boolean) {
		return (state:IssueState) => state.set('groupVisibility',state.groupVisibility.set(id,visible))
	}
	
	/**
	 * Set filtering and sorting
	 *
	 * @param issueFilter
	 * @param issueSort
	 * @returns {(issueState:IssueState, getState:any)=>Map<(value:Map<any, any>)=>Map<any, any>, V>}
	 */
	
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
			availRepos = enabledAvailableReposSelector(getState),
			repoIds = availRepos.map(availRepo => availRepo.repoId)
		
		log.debug(`Loading issues for repos`, repoIds)
		
		this.setIssues(await this.getIssues(availRepos))
		
	}
	
	/**
	 * Set all activity - add pull requests, etc
	 *
	 * @param comments
	 * @param issuesEvents
	 */
	@ActionReducer()
	private setActivity(comments:List<Comment>,issueEvents:List<IssuesEvent>) {
		return (state:IssueState) =>
			state
				.set('comments',comments)
				.set('issuesEvents',issueEvents)
		
	}
	
	/**
	 * Get all activity for an issue
	 *
	 * @param issue
	 * @returns {{comments: any}}
	 */
	async getActivity(issue:Issue) {
		
		const
			comments:List<Comment> = await pagedFinder(
				Comment,
				FinderItemsPerPage,
				getStores().comment,
				(commentStore:CommentStore,nextRequest:FinderRequest) =>
					commentStore.findByCommentPrefix(nextRequest,issue.repoId, issue.number)
			),
			issuesEvents:List<IssuesEvent> = await pagedFinder(IssuesEvent,FinderItemsPerPage,getStores().issuesEvent,
				(issuesEventStore:IssuesEventStore,nextRequest:FinderRequest) =>
					issuesEventStore.findByIssue(nextRequest,issue)
			)
		
		return {
			comments,
			issuesEvents
		}
		
	}
	
	/**
	 * Load comments (and should be all activity, pull requests etc)
	 * for an issue
	 *
	 * @param issueId
	 */
	@ActionThunk()
	loadActivityForIssue(issueId: number) {
		return async(dispatch, getState) => {
			
			// Issue repo
			let
				issues:List<Issue> = issuesSelector(getState())
			
			//log.debug(`Loading issue activity`,issues,issueId)
			if (!isListType(issues,Issue))
				return
			
			let
				issue: Issue = issues.find(issue => issue.id === issueId)
			
			if (!issue) {
				log.error(`Issue not found in state: ${issueId}`)
				//assert(issue, `Issue still not found in state ${issueId}`)
				return
			}
			
			
			
			const
				{comments,issuesEvents} = await this.getActivity(issue)
			
			log.debug(`Loading activity for issue `, issueId,comments,issuesEvents)
			this.setActivity(comments,issuesEvents)
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
	
	
	/**
	 * Gets issue list from state, if no ids are provided
	 * then it uses the selected ids
	 * @param issueIds
	 */
	getSelectedIssuesFromState(...issueIds:number[]) {
		
		issueIds = issueIds.length ?
			issueIds :
			this.state.selectedIssueIds
		
		const
			{issues} = this.state
		
		return issueIds
			.map(id => issues.find(it => it.id === id))
			.filter(issue => !isNil(issue))
	}
	
	//export type TIssueIdOrIssue = Array<number|Issue>
	
	/**
	 * Reload all issues in the passed list
	 * that are currently in the state
	 *
	 * @param issues
	 */
	reloadIssues(issues:List<Issue>|Issue[])
	
	/**
	 * Same as above - but with rest args of ids or issues
	 *
	 * @param issuesOrIssueIds
	 */
	reloadIssues(...issuesOrIssueIds:Array<number|Issue>)
	
	@ActionThunk()
	reloadIssues(...args:any[]) {
		return async (dispatch,getState) => {
			let
				issues:Issue[] = (Array.isArray(args[0])) ?
					args[0] : isListType(args[0],Issue) ?
					args[0].toArray() :
					isNumber(args[0]) ? nilFilter(args.filter(id => this.state.issues.find(it => it.id === id)))
						: args
						
			
			log.debug(`Going to reload issues`, issues, 'from args', args)
			if (!issues.length) {
				log.warn(`No issues found in state to update from `, args)
				return
			}
			
			const
				updatedIssues = await this.getIssues(availableReposSelector(getStoreState()),issues)
			
			this.updateIssuesInState(List<Issue>(updatedIssues))
		
		}
	}
	
	
	/**
	 * This is actually 'state' in github - but gets confusing since
	 * our system is in redux
	 *
	 * @param newState
	 * @param issueIds
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@ActionThunk()
	setIssueStatus(newState: TIssueState, ...issueIds: number[]) {
		return async(dispatch, getState) => {
			let
				issues = this.getSelectedIssuesFromState(...issueIds)
			
			log.debug(`Going to delete ${issues.length} issues`)
			
			const
				client = Container.get(GitHubClient),
				closeIssues = _.cloneDeep(issues)
			
			
			for (let issue of closeIssues) {
				if (!hasEditPermission(issue)) {
					addErrorMessage(`You don't have permission to close this issue: ${issue.number}`)
					return
				}
			}
			
			const
				promises = closeIssues
					.map(async(issue: Issue) => {
						issue.state = newState
						
						try {
							assert(issue.repo, 'repo not found for issue: ' + issue.repoId)
							
							return await this.saveAndUpdateIssueModel(client,issue.repo,issue)
							
						} catch (err) {
							log.error('set issue state failed', err)
							addErrorMessage(`Unable set set issue state for #${issue.number}: ${err.message}`)
						}
					}),
				
				// WAIT FOR ALL RESPONSES
				results = await Promise.all(promises)
			
			
			addMessage(`Closed ${results.length} issues successfully`)
			
			// Now we simply update the state - remvoed
			//this.loadIssuesAction(dispatch, getState)
			
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
