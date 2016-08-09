


import {debounce} from 'lodash-decorators'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {AutoWired, Inject, Container} from 'typescript-ioc'
import {Stores} from 'shared/Stores'
import {ActionFactory, Action, ActionReducer} from 'typedux'
import {Dialogs, IssueKey, DataKey, DataRequestIssueListId} from 'shared/Constants'
import {cloneObject, extractError} from 'shared/util/ObjectUtil'
import {Comment} from 'shared/models/Comment'
import {IssueMessage, IssueState, IIssueSort, IIssueFilter} from './IssueState'
import {Issue, IssueStore,TIssueState} from 'shared/models/Issue'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {
	enabledRepoIdsSelector, availRepoIdsSelector, availReposSelector,
	enabledReposSelector
} from 'shared/actions/repo/RepoSelectors'
import {DataRequest, DataState} from 'shared/actions/data/DataState'
import {selectedIssueIdsSelector, selectedIssueSelector} from 'shared/actions/issue/IssueSelectors'
import {issueModelsSelector, repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {GitHubClient} from 'shared/GitHubClient'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {addErrorMessage} from 'shared/Toaster'
import {addMessage} from 'shared/Toaster'
import Settings from 'shared/Settings'
import {TIssuePatchMode} from 'shared/actions/issue'

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




function hasEditPermission(issue:Issue) {
	const {repo} = issue

	assert(repo,'can not test permission without repo set on issue')

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
	stores:Stores

	@Inject
	uiActions:UIActionFactory



	constructor() {
		super(IssueState)
	}

	leaf():string {
		return IssueKey;
	}

	@ActionReducer()
	setIssueIds(issueIds:number[]) {
		return (state:IssueState) => {
			let selectedIssueIds = state.selectedIssueIds
			if (selectedIssueIds.length) {
				selectedIssueIds = selectedIssueIds
					.filter(selectedIssueId => (
						issueIds.includes(selectedIssueId)
					))

				// if (!selectedIssueIds.length && issueIds.length)
				// 	selectedIssueIds = [issueIds[0]]
			}

			let newState = state.set('issueIds',issueIds)
			if (!_.isEqual(selectedIssueIds,state.selectedIssueIds))
				newState = newState.set('selectedIssueIds',selectedIssueIds)

			return newState
		}

	}


	requestIssueIdsAction(issueIds:number[], clear:boolean, dispatch, getState)  {
		const actions = this.withDispatcher(dispatch, getState)
		//const enabledRepoIds = enabledRepoIdsSelector(getState())


		// Now push the models into the data state for tracking
		const dataActions = Container.get(DataActionFactory)
		const dataRequest = DataRequest.create(DataRequestIssueListId,false,issueIds,Issue.$$clazz,clear)


		actions.setIssueIds(issueIds)
		dataActions.submitRequest(dataRequest)


		// if (!clear) {
		// 	issues = _.uniqBy(issues.concat(internalIssueSelector(getState()) || []),'id')
		// }
		//
		// actions.setInternalIssues(issues)

	}



	/**
	 * Internally change the issue list
	 *
	 * @param issueIds
	 * @param clear
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	private requestIssueIds(issueIds:number[], clear=false) {
		return (dispatch,getState) => this.requestIssueIdsAction(issueIds,clear,dispatch,getState)
	}


	@ActionReducer()
	private setPatchIssues(issues:Issue[],mode:TIssuePatchMode = null) {
		return (state:IssueState) => state
			.set('patchIssues',issues)
			.set('patchMode',mode || state.patchMode)
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
		return (state:IssueState) => state
			.set('selectedIssueIds',selectedIssueIds)
			.set('editingInline',false)
	}

	/**
	 * Start editing an i
	 * @param fromIssue
	 */
	createIssueInline(fromIssue:Issue) {
		this.newIssue(fromIssue,true)
	}


	/**
	 * Open issue patch dialog
	 *
	 * @param mode
	 * @param issues
	 */
	patchIssues(mode:TIssuePatchMode,...issues:Issue[]) {
		this.setPatchIssues(issues,mode)
		this.uiActions.setDialogOpen(Dialogs.IssuePatchDialog,true)
	}

	/**
	 * Apply patches to issues
	 *
	 * @param patch
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	applyPatchToIssues(patch:any,useAssign,...issues:Issue[]) {
		return async(dispatch, getState) => {
			if (!issues.length)
				return

			const originalIssues = issues
			const actions = this.withDispatcher(dispatch,getState)
			const dataActions:DataActionFactory = Container.get(DataActionFactory)
			const repoModels = repoModelsSelector(getState())
			const client = Container.get(GitHubClient)

			try {
				// Get the latest issues with revision info etc
				issues = await Promise.all(
					issues.map(issue => this.stores.issue.get(issue.id))
				)

				// Now apply the patch to clones
				issues = issues.map(issue => (useAssign) ?
					_.assign(cloneObject(issue),patch) :
					_.merge(cloneObject(issue),patch))

				// One by one update the issues on GitHub
				for (let issue of issues) {
					const repo = issue.repo || repoModels.get(`${issue.repoId}`)
					assert(repo, `Unable to find repo for issue patching: ${issue.repoId}`)

					issue = await client.issueSave(repo, issue)

					// Update each model as it happens as an individual issue can fail
					dataActions.updateModels(Issue.$$clazz,{[`${issue.id}`]:issue})

				}

				actions.setIssueSaving(false)
				actions.setPatchIssues(null)

				this.uiActions.closeAllDialogs()

			} catch (err) {
				log.error('issue patching failed',patch,issues,originalIssues)
				actions.setIssueSaving(false,extractError(err))
			}
		}
	}

	@Action()
	private doIssueSave(issue:Issue) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const dataActions:DataActionFactory = Container.get(DataActionFactory)
			const client = Container.get(GitHubClient)

			const repoModels = repoModelsSelector(getState())
			const enabledRepoIds = enabledRepoIdsSelector(getState())
			const repo = issue.repo || repoModels.get(`${issue.repoId}`)

			try {
				const issueStore:IssueStore = this.stores.issue

				// First save to github
				const savedIssue:Issue = await client.issueSave(repo,issue)
				const mergedIssue = _.merge({},issue,savedIssue)

				const persistedIssue = await issueStore.save(mergedIssue)
				const updatedIssue = _.cloneDeep(persistedIssue)

				// If the issue belongs to an enabled repo then reload issues
				if (enabledRepoIds.includes(updatedIssue.repoId)) {
					let issueIds:number[] = actions.state.issueIds
					if (!issueIds)
						actions.loadIssues()
					else {

						if (!issueIds.includes(updatedIssue.id)) {
							issueIds = issueIds.concat(updatedIssue.id)
						}

						dataActions.updateModels(Issue.$$clazz,{[`${updatedIssue.id}`]:updatedIssue})
						const issueMatcher = item => item.id !== updatedIssue.id && !(item.repoId !== updatedIssue.repoId && item.number !== updatedIssue.number)

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

				actions.setIssueSaving(false,extractError(err))

				//addErrorMessage(err)
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
	setIssueSaving(saving:boolean,error:Error = null) {
		return (state:IssueState) => {
			return state
				.set('issueSaving',saving)
				.set('issueSaveError',error)
		}
	}

	/**
	 * Save an issue, update or create
	 *
	 * @param issue
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */

	issueSave(issue:Issue) {
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
	setEditingIssue(editingIssue:Issue,inline:boolean = false) {
		return (state:IssueState) => state.set('editingIssue',editingIssue).set('editingInline',inline)
	}

	/**
	 * Set whether or not inline editing is taking place
	 *
	 * @param inline
	 * @returns {(state:IssueState)=>Map<string, boolean>}
	 */
	@ActionReducer()
	setEditingInline(inline:boolean) {
		return (state:IssueState) => state.set('editingInline',inline)
	}

	@ActionReducer()
	editInline(groupIndex:number,issueIndex:number,issue:Issue) {
		return (state:IssueState) => state
			.set('editingInline',true)
			.set('editingIssue',issue)
			.set('editInlineConfig',{
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
	newIssue(fromIssue:Issue = null, inline:boolean = false) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				uiActions = Container.get(UIActionFactory),
				appActions = Container.get(AppActionFactory),
				dialogName = Dialogs.IssueEditDialog


			if (this.uiActions.state.dialogs[dialogName]) {
				log.info('Dialog is already open',dialogName)
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

			const issue = await fillIssue(new Issue({repoId}),repoId)

			if (fromIssue)
				assign(issue,_.cloneDeep(_.pick(fromIssue,'milestone','labels')))

			actions.setIssueSaving(false)
			actions.setEditingIssue(issue,inline)

			uiActions.setDialogOpen(dialogName,true)
		}
	}

	@Action()
	editIssue() {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				uiActions = Container.get(UIActionFactory),
				dialogName = Dialogs.IssueEditDialog,
				issue = selectedIssueSelector(getState())

			assert(issue,'You must have an issue selected in order to edit one ;)')

			const editingIssue = await fillIssue(_.cloneDeep(issue),issue.repoId)

			actions.setIssueSaving(false)
			actions.setEditingIssue(editingIssue)
			uiActions.setDialogOpen(dialogName,true)
		}
	}



	private filteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return (issueState:IssueState,getState) => {

			return issueState.withMutations((newIssueState:IssueState) => {

				if (issueFilter)
					newIssueState.set('issueFilter', issueFilter)

				if (issueSort)
					newIssueState.set('issueSort', issueSort)

				return newIssueState
			})
		}


	}


	/**
	 * Set the group by mode
	 *
	 * @param groupBy
	 */
	setGroupBy(groupBy:string) {
		const
			issueSort = this.state.issueSort,
			newIssueSort:IIssueSort = assign(
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
			newIssueSort:IIssueSort = _.assign(
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
	setSortByField(field:string) {
		const
			issueSort = this.state.issueSort,
			newIssueSort:IIssueSort = assign(
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
			newIssueSort:IIssueSort = _.assign(
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
	toggleIssueFilterMilestone(milestone:Milestone) {
		const {issueFilter} = this.state
		const
			newIssueFilter = _.cloneDeep(issueFilter),
			milestoneIds = newIssueFilter.milestoneIds || (newIssueFilter.milestoneIds = []),
			index = milestoneIds.indexOf(milestone.id)

		if (index === -1) {
			milestoneIds.push(milestone.id)
		} else {
			milestoneIds.splice(index,1)
		}


		this.setFilteringAndSorting(newIssueFilter)
	}

	/**
	 * Toggle a label on the issue filter
	 *
	 * @param label
	 */
	toggleIssueFilterLabel(label:Label) {
		const {issueFilter} = this.state
		const
			newIssueFilter = _.cloneDeep(issueFilter),
			labelUrls = newIssueFilter.labelUrls || (newIssueFilter.labelUrls = []),
			index = labelUrls.indexOf(label.url)

		if (index === -1) {
			labelUrls.push(label.url)
		} else {
			labelUrls.splice(index,1)
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
	protected setCommentIds(commentIds:string[]) {
		return (issueState:IssueState) => issueState.set('commentIds',commentIds)
	}

	/**
	 * Set filtering and sorting
	 *
	 * @param issueFilter
	 * @param issueSort
	 * @returns {(issueState:IssueState, getState:any)=>Map<(value:Map<any, any>)=>Map<any, any>, V>}
	 */
	@ActionReducer()
	setFilteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return this.filteringAndSorting(issueFilter,issueSort)
	}


	private async loadIssuesAction(dispatch,getState) {
		const
			actions = this.withDispatcher(dispatch, getState),
			dataActions = Container.get(DataActionFactory)

		// Issue repo
		const
			issueState = actions.state,
			issueStore = actions.stores.issue,
			issueFilter = issueState.issueFilter

		const repoIds = enabledRepoIdsSelector(getState())
		log.info(`Loading issues for repos`,repoIds)

		let offset = 0
		const limit = 50
		let labels = await actions.stores.label.findByRepoId(...repoIds)
		let milestones = await actions.stores.milestone.findByRepoId(...repoIds)

		let issueIds:number[] = await (issueFilter.includeClosed ?
			issueStore.findIdsByRepoId(...repoIds) :
			issueStore.findIdsByStateAndRepoId('open',...repoIds))

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

		const milestoneMap = milestones.reduce((map,nextMilestone) => {
			map['' + nextMilestone.id] = nextMilestone
			return map
		},{})

		const labelMap = labels.reduce((map,nextLabel) => {
			map[nextLabel.url] = nextLabel
			return map
		},{})

		dataActions.updateModels(
			Milestone.$$clazz,
			milestoneMap
		)

		dataActions.updateModels(
			Label.$$clazz,
			labelMap
		)

		actions.requestIssueIds(issueIds,false)
	}

	@Action()
	loadIssues() {
		return (dispatch,getState) => this.loadIssuesAction(dispatch,getState)
	}

	@Action()
	clearAndLoadIssues(...repoIds:number[]) {
		return (dispatch,getState) => {
			this.requestIssueIdsAction([],true,dispatch,getState)
			this.loadIssuesAction(dispatch,getState)
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
	includeClosedIssues(includeClosed:boolean) {
		const updatedFilter = assign(_.cloneDeep(this.state.issueFilter),{includeClosed})
		this.setFilteringAndSorting(updatedFilter)
		this.loadIssues()

	}



	@Action()
	setIssueState(newState:TIssueState,...issueIds:number[]) {
		return async (dispatch,getState) => {
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
				.map(async (issue:Issue) => {
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
						log.error('set issue state failed',err)
						addErrorMessage(`Unable set set issue state for #${issue.number}: ${err.message}`)
					}
				})

			const results = await Promise.all(promises)

			addMessage(`Closed ${results.length} issues successfully`)

			this.loadIssuesAction(dispatch,getState)

		}
	}
}


export default IssueActionFactory