


import {debounce} from 'lodash-decorators'
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
import Toaster from 'shared/Toaster'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {enabledRepoIdsSelector, availRepoIdsSelector, availReposSelector} from 'shared/actions/repo/RepoSelectors'
import {DataRequest, DataState} from 'shared/actions/data/DataState'
import {selectedIssueIdsSelector, issueSelector} from 'shared/actions/issue/IssueSelectors'
import {issueModelsSelector, repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {GitHubClient} from 'shared/GitHubClient'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'


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

	@ActionReducer()
	setIssueIds(issueIds:number[]) {
		return (state:IssueState) => state.set('issueIds',issueIds)
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
	 * @param issues
	 * @returns {(dispatch:any, getState:any)=>Promise<undefined>}
	 */
	@Action()
	private requestIssueIds(issueIds:number[], clear=false) {
		return (dispatch,getState) => this.requestIssueIdsAction(issueIds,clear,dispatch,getState)
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
					let issueIds:number[] = actions.state.issueIds
					if (!issueIds)
						actions.loadIssues()
					else {
						const dataActions:DataActionFactory = Container.get(DataActionFactory)
						if (!issueIds.includes(updatedIssue.id)) {
							issueIds = issueIds.concat(updatedIssue.id)
						}


						dataActions.updateModels(Issue,{[`${updatedIssue.id}`]:updatedIssue})
							const issueMatcher = item => item.id !== updatedIssue.id && !(item.repoId !== updatedIssue.repoId && item.number !== updatedIssue.number)

						// internalIssues = internalIssues.filter(issueMatcher).concat([updatedIssue])

						actions.requestIssueIds(issueIds)

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

			return issueState.withMutations((newIssueState:IssueState) => {

				if (issueFilter)
					newIssueState.set('issueFilter', issueFilter)

				if (issueSort)
					newIssueState.set('issueSort', issueSort)

				return newIssueState
			})
		}


	}


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
	toggleSortDirection() {
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

		if (index == -1) {
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

		if (index == -1) {
			labelUrls.push(label.url)
		} else {
			labelUrls.splice(index,1)
		}

		this.setFilteringAndSorting(newIssueFilter)
	}

	//
	// removeMilestoneFromFilter(milestone:Milestone) {
	// 	const {issueFilter} = this.state
	// 	const
	// 		newIssueFilter = _.cloneDeep(issueFilter),
	// 		{milestoneIds} = newIssueFilter,
	// 		index = (milestoneIds || []).indexOf(milestone.id)
	//
	// 	if (index == -1) return
	//
	// 	milestoneIds.splice(index,1)
	//
	// 	this.setFilteringAndSorting(newIssueFilter)
	// }

	@debounce(200)
	@ActionReducer()
	protected setCommentIds(commentIds:string[]) {
		return (issueState:IssueState) => issueState.set('commentIds',commentIds)
	}

	@ActionReducer()
	setFilteringAndSorting(issueFilter:IIssueFilter = null,issueSort:IIssueSort = null) {
		return this.filteringAndSorting(issueFilter,issueSort)
	}


	private async loadIssuesAction(dispatch,getState) {
		const actions = this.withDispatcher(dispatch, getState)

		// Issue repo
		const issueState = actions.state
		const issueStore = actions.stores.issue

		const repoIds = availRepoIdsSelector(getState())
		log.info(`Loading issues for repos`,repoIds)

		let offset = 0
		const limit = 50
		let issueIds:number[] = await issueStore.findIdsByRepoId(...repoIds)

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
			await dataActions.submitRequest(DataRequest.create('comments-list',false,commentIds,Comment.$$clazz),commentMap)

			actions.setCommentIds(commentIds)
			//actions.setFilteringAndSorting()

		}
	}

}


export default IssueActionFactory