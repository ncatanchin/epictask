import * as Immutable from "immutable"
import { List } from "immutable"
import {
	OneAtATime,
	cloneObjectShallow,
	cloneObject,
	notifyError,
	RepoKey,
	UIKey,
	Provided,
	ContextMenu
} from "epic-global"
import IssuesPanelState from "./IssuesPanelState"
import { isNumber, isNil, getValue } from "typeguard"
import { getUIActions, getIssueActions, IssueActionFactory } from "epic-typedux"
import { Issue, Label, Comment, Milestone, IIssueListItem, DefaultIssueCriteria, IssuesEvent } from "epic-models"
import { makeIssuesPanelStateSelectors, TIssuesPanelSelectors } from "./IssuesPanelSelectors"
import { addDatabaseChangeListener, removeDatabaseChangeListener } from "epic-database-client"
import {
	availableRepoIdsSelector,
	availableReposSelector
} from "epic-typedux/selectors"
import { StoreViewController } from "epic-ui-components/layout"
/**
 * Created by jglanz on 11/5/16.
 */

const
	log = getLogger(__filename)


// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


export function getIssuesPanelSelector(fn: (selectors: TIssuesPanelSelectors) => any) {
	return (state, props) => getValue(() => fn(props.viewController.selectors)(state, props))
}


/**
 * IssuesPanelController
 *
 * @class IssuesPanelController
 * @constructor
 **/
@Provided
export class IssuesPanelController extends StoreViewController<IssuesPanelState> implements IViewController<IssuesPanelState> {
	
	
	selectors
	
	
	/**
	 * Use all repo ids
	 */
	private useAllRepoIds:boolean
	
	/**
	 * Mounted
	 */
	private mounted: boolean
	
	/**
	 * All un-subs for destruction
	 */
	private unsubscribers: Function[]
	
	
	
	/**
	 * All Current issues
	 *
	 * @returns {T}
	 */
	get issues(): List<Issue> {
		return getValue(() => this.state.issues, List<Issue>())
	}
	
	/**
	 * All focused issues in state
	 *
	 */
	get focusedIssues(): List<Issue> {
		return getValue(() => this.issues.filter(it => it.focused)) as List<Issue>
	}
	
	/**
	 * Focused issue ids
	 *
	 * @returns {T}
	 */
	get focusedIssueIds(): List<number> {
		return getValue(() => this.focusedIssues.map(it => it.id)) as List<number>
	}
	
	/**
	 * Create the controller
	 *
	 * @param id
	 * @param initialState
	 * @param opts
	 */
	constructor(id: string, initialState: IssuesPanelState = new IssuesPanelState(),opts:any = {}) {
		super(id,initialState,opts)
		
		assign(this,opts)
		
		const
			viewProvider = opts.storeViewProvider
		
		this.selectors = makeIssuesPanelStateSelectors(id,() => viewProvider().state)
		
	}
	
	setUseAllRepoIds(useAllRepoIds) {
		this.useAllRepoIds = useAllRepoIds
		
		return this
	}
	
	/**
	 * Observer for repo changes
	 */
	private onReposChanged = (newAvailRepos, oldAvailRepos) => {
		const
			newIds = newAvailRepos && newAvailRepos.filter(it => it.enabled).map(it => it.id),
			oldIds = oldAvailRepos && oldAvailRepos.filter(it => it.enabled).map(it => it.id)
		
		if (newIds && !Immutable.is(newIds, oldIds)) {
			log.debug(`Enabled repos changed`, newIds, oldIds)
			this.loadIssues()
		}
	}
	
	private onFilterSortChanged = (newVal, oldVal) => {
		log.debug(`Filter/Sort changed`, newVal, oldVal)
		
		//this.loadIssues()
	}
	
	/**
	 * On selected issue ids changed
	 *
	 * @param newVal
	 * @param oldVal
	 */
	private onSelectedIssueIdsChanged = _.debounce((newVal: List<number>) => {
		log.debug(`Selected issue ids changed`, newVal)
		if (getValue(() => newVal.size, 0) !== 1) {
			return
		}
		
		const
			id = newVal.get(0),
			issue = this.state.issues.find(it => it.id === id)
		
		if (!issue) {
			log.warn(`Issue id selected, but issue is not available`, id)
			return
		}
		
		this.loadActivity(issue)
		
	},100)
	
	/**
	 * Handle database changes
	 *
	 * @type {{}}
	 */
	private databaseChangeHandlers = {
		
		// ISSUES
		[Issue.$$clazz]: function (changes: IDatabaseChange[]) {
			let
				repoIds = availableRepoIdsSelector(getStoreState()),
				models = changes
					.map(it => it.model)
					.filter(it => it && repoIds.includes(it.repoId))
			
			log.debug(`Updating models`, models)
			
			this.updateIssuesInState(List(models))
		},
		
		// COMMENTS
		[Comment.$$clazz]: function (changes: IDatabaseChange[]) {
			const
				repoIds = availableReposSelector(getStoreState()).map(it => it.id),
				models = changes
					.map(it => it.model)
					.filter(it => it && repoIds.includes(it.repoId))
			
			log.debug(`Updating models`, models)
			
			let
				{ comments } = this.state,
				selectedIssue = this.selectors.selectedIssueSelector(getStoreState())
			
			models.forEach(model => {
				const
					index = comments.findIndex(it => it.id === model.id)
				
				
				if (index > -1) {
					comments = comments.set(index, model)
				} else if (
					selectedIssue &&
					selectedIssue.number === model.issueNumber &&
					selectedIssue.repoId === model.repoId
				) {
					comments = comments.push(model)
				}
			})
			
			if (comments !== this.state.comments) {
				this.updateState({ comments })
			}
		},
		// COMMENTS
		[IssuesEvent.$$clazz]: function (changes: IDatabaseChange[]) {
			const
				repoIds = availableReposSelector(getStoreState()).map(it => it.id),
				models = changes
					.map(it => it.model)
					.filter(it => it && repoIds.includes(it.repoId))
			
			log.debug(`Updating models`, models)
			
			let
				{ events } = this.state,
				selectedIssue = this.selectors.selectedIssueSelector(getStoreState())
			
			models.forEach(model => {
				const
					index = events.findIndex(it => it.id === model.id)
				
				
				if (index > -1) {
					events = events.set(index, model)
				} else if (
					selectedIssue &&
					selectedIssue.number === model.issueNumber &&
					selectedIssue.repoId === model.repoId
				) {
					events = events.push(model)
				}
			})
			
			if (events !== this.state.events) {
				this.updateState({ events })
			}
		}
	}
	
	
	/**
	 * When issues change in the database
	 *
	 * @param allChanges
	 */
	private onDatabaseChanged = (allChanges: IDatabaseChange[]) => {
		const
			groups = _.groupBy(allChanges, it => it.type)
		
		Object
			.keys(groups)
			.forEach(type => {
				this.databaseChangeHandlers[ type ].apply(this, [ groups[ type ] ])
			})
		
	}
	
	
	// /**
	//  * Create a view state path
	//  *
	//  * @param keys
	//  * @returns {[string,string,any,string,any]}
	//  */
	// makeStatePath(...keys) {
	// 	return [ UIKey, 'views', this.view.index, 'state', ...keys ]
	// }
	
	/**
	 * Set mounted
	 *
	 * @param mounted
	 */
	setMounted(mounted: boolean) {
		this.mounted = mounted
		
		if (this.unsubscribers) {
			this.unsubscribers.forEach(it => it())
			this.unsubscribers = null
		}
		
		if (!mounted) {
			removeDatabaseChangeListener(Issue, this.onDatabaseChanged)
			removeDatabaseChangeListener(IssuesEvent, this.onDatabaseChanged)
			removeDatabaseChangeListener(Comment, this.onDatabaseChanged)
			return
		}
		
		const
			store = getStore()
		
		addDatabaseChangeListener(Issue, this.onDatabaseChanged)
		addDatabaseChangeListener(IssuesEvent, this.onDatabaseChanged)
		addDatabaseChangeListener(Comment, this.onDatabaseChanged)
		
		this.unsubscribers = [
			store.observe([ RepoKey, 'availableRepos' ], this.onReposChanged)
		]
		
		// if (!this.useLocalState)
		//this.unsubscribers.push(store.observe(this.makeStatePath('selectedIssueIds'), this.onSelectedIssueIdsChanged))
		
		this.loadIssues()
	}
	
	
	
	showViewer() {
		const
			{selectedIssueIds} = this.getState()
		
		if (getValue(() => selectedIssueIds.size) !== 1) {
			return log.debug(`Can only open viewer for a single selected issue`)
		}
		
		const
			uri = (<any>RouteRegistryScope.asMap()).IssueViewDialog.makeURI(this.getSelectedIssue())
		
		getUIActions().openWindow(uri)
	}
	
	/**
	 * Load a single issue - for issue viewer really
	 */
	loadSingleIssue = _.debounce(async (issueKey) => {
		const
			issue = await getIssueActions().loadIssue(issueKey)
		
		this.setIssues(List([issue]))
		this.setSelectedIssueIds(List([issue.id]))
	}, 100)
	
	/**
	 * Updates the current issues
	 */
	loadIssues = _.debounce(OneAtATime({}, async() => {
		const
			{ criteria, selectedIssueIds } = this.state,
			actions = new IssueActionFactory(),
			repoIds = availableRepoIdsSelector(getStoreState()),
			issues = await actions.queryIssues(criteria,this.useAllRepoIds && repoIds)
		
		log.debug(`Loaded issues`,issues,repoIds)
		this.updateState({ issues })
		
		if (selectedIssueIds && selectedIssueIds.size === 1) {
			const
				selectedIssueId = selectedIssueIds.get(0),
				issue = issues.find(it => it.id === selectedIssueId)
			
			if (issue)
				this.loadActivity(issue)
		}
	}), 100)
	
	
	/**
	 * Load activity for an issue
	 */
	loadActivity = _.debounce(OneAtATime({}, async(issue: Issue) => {
		
		const
			actions = new IssueActionFactory(),
			{ comments, events } = await actions.getActivity(issue)
		
		this.setActivity(comments, events)
	}), 400)
	
	/**
	 * Update issues in the current panel
	 */
	private updateIssuesInState = this.makeStateUpdate((updatedIssues: List<Issue>) => {
		return (state: IssuesPanelState) => state.withMutations((newState: IssuesPanelState) => {
			let
				{ issues } = newState,
				availRepos = availableReposSelector(getStoreState()),
				repoIds = availRepos.map(it => it.id)
			
			updatedIssues
				.filter(updatedIssue => repoIds.includes(updatedIssue.repoId))
				.forEach(updatedIssue => {
					const
						issueIndex = issues.findIndex(issue => issue.id === updatedIssue.id)
					
					if (!updatedIssue.repo) {
						updatedIssue.repo = getValue(() =>
							availRepos.find(it => it.id === updatedIssue.repoId).repo
						)
					}
					
					issues = (issueIndex > -1) ?
						issues.set(issueIndex, cloneObjectShallow(issues.get(issueIndex), updatedIssue)) :
						issues.push(updatedIssue)
				})
			
			return newState.set('issues', issues)
		})
	})
	
	
	private updateCriteria = this.makeStateUpdate((criteria: IIssueCriteria = null) =>
		(state: IssuesPanelState) => (criteria) ?
			state
				.set('criteria', cloneObject(criteria))
				.set('searchText', '') :
			state
	)
	
	
	setActivity(comments: List<Comment>, events: List<IssuesEvent>) {
		this.updateState({
			comments,
			events
		})
	}
	
	
	/**
	 * Create a new comment
	 */
	newComment() {
		const
			issue = this.selectors.selectedIssueSelector(getStoreState())
		
		if (!issue) {
			return notifyError('You can only add a comment when exactly one issue is selected')
		}
		
		getIssueActions().editComment(issue)
		//this.editComment(issue)
	}
	
	/**
	 * Set current issues
	 *
	 * @param issues
	 * @returns {(state:IssueState)=>Map<string, any>}
	 */
	
	private setIssues = this.makeStateUpdate((issues: List<Issue>) => (state: IssuesPanelState) => state.set(
		'issues',
		state.issues.withMutations(newIssues => {
			issues.forEach(issue => {
				const
					index = newIssues.findIndex(it => it.id === issue.id)
				
				newIssues = index === -1 ?
					newIssues.push(issue) :
					newIssues.set(index, issue)
				
			})
		})
	))
	
	
	/**
	 * The the selected issue ids
	 *
	 * (Highlighted issues in the main list)
	 *
	 * @param selectedIssueIds
	 * @returns {(state:IssueState)=>Map<string, number[]>}
	 */
	
	setSelectedIssueIds(selectedIssueIds: List<number>) {
		this.updateState({
			selectedIssueIds,
			editInlineConfig: null
		})
		
		this.onSelectedIssueIdsChanged(selectedIssueIds)
		
	}
	
	/**
	 * Toggle selected as focused
	 */
	toggleSelectedAsFocused() {
		let
			{ selectedIssueIds, issues } = this.state
		
		if (!selectedIssueIds || !selectedIssueIds.size)
			return
		
		// COPY
		let
			{ focusedIssues, focusedIssueIds } = this
		
		let
			updatedIssues
		
		if (selectedIssueIds.every(id => focusedIssueIds.includes(id))) {
			updatedIssues = selectedIssueIds
				.map(id => focusedIssues.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => cloneObjectShallow(it, {
					focused: false
				})) as List<Issue>
		} else {
			updatedIssues = selectedIssueIds
				.map(id => issues.find(it => it.id === id))
				.filter(it => !isNil(it) && !it.focused)
				.map(it => cloneObjectShallow(it, {
					focused: true
				})) as List<Issue>
		}
		
		getIssueActions().saveIssues(updatedIssues, true)
		this.updateIssuesInState(updatedIssues)
		
	}
	
	
	/**
	 * Set focus on an issue
	 *
	 * @param issue
	 */
	focusOnIssue(issue: Issue)
	focusOnIssue(issueId: number)
	focusOnIssue(issueOrIssueId: Issue|number) {
		const
			issueId = isNumber(issueOrIssueId) ? issueOrIssueId : issueOrIssueId.id
		
		let
			issue = this.issues.find(it => it.id === issueId)
		
		if (!issue || issue.focused) {
			log.debug(`Issue id ${issueId} is already focused`, issue)
			return
		}
		
		issue.focused = true
		getIssueActions().saveIssue(issue, true)
		
		this.updateIssuesInState(List([ issue ]))
		
	}
	
	/**
	 * Remove issue focus
	 *
	 * @param issue
	 */
	removeIssueFocus(issue: Issue)
	removeIssueFocus(issueId: number)
	removeIssueFocus(issueOrIssueId: Issue|number) {
		const
			issueId = isNumber(issueOrIssueId) ? issueOrIssueId : issueOrIssueId.id
		
		let
			issue = this.issues.find(it => it.id === issueId)
		
		if (!issue || !issue.focused) {
			log.debug(`Issue id ${issueId} is already NOT focused`, issue)
			return
		}
		
		issue.focused = false
		getIssueActions().saveIssue(issue, true)
		
		this.updateIssuesInState(List([ issue ]))
		
	}
	
	
	/**
	 * Clear all current issue filters
	 */
	clearFilters() {
		this.updateCriteria(DefaultIssueCriteria)
	}
	
	/**
	 * Set the group by mode
	 *
	 * @param groupBy
	 */
	setGroupBy(groupBy: string) {
		const
			issueSort = this.getSort(),
			newIssueSort: IIssueSort = cloneObjectShallow(issueSort, {
				groupBy
			})
		
		this.setCriteria(cloneObjectShallow(this.getCriteria(), { sort: newIssueSort }))
	}
	
	/**
	 * Toggle ascending and descending grouping
	 */
	toggleGroupByDirection() {
		const
			issueSort = this.getSort(),
			newIssueSort: IIssueSort = cloneObjectShallow(issueSort, {
				groupByDirection: (issueSort.groupByDirection === 'asc') ?
					'desc' :
					'asc'
			})
		
		this.setCriteria(cloneObjectShallow(this.getCriteria(), { sort: newIssueSort }))
	}
	
	
	/**
	 * Set the sorting field
	 *
	 * @param field
	 */
	setSortByField(field: string) {
		const
			{ criteria } = this.state,
			issueSort = criteria.sort,
			newIssueSort: IIssueSort =
				cloneObject(issueSort, { fields: [ field ] })
		
		
		this.setCriteria(cloneObjectShallow(criteria, { sort: newIssueSort }))
	}
	
	/**
	 * Toggle ascending and descending sort
	 */
	toggleSortByDirection() {
		const
			{ criteria } = this.state,
			issueSort = criteria.sort,
			newIssueSort: IIssueSort =
				cloneObject(issueSort, {
					direction: (issueSort.direction === 'asc') ?
						'desc' :
						'asc'
				})
		
		
		this.setCriteria(cloneObjectShallow(criteria, { sort: newIssueSort }))
		
	}
	
	/**
	 * Toggle milestone on issue filter
	 *
	 * @param milestone
	 */
	toggleIssueFilterMilestone(milestone: Milestone) {
		let
			{ criteria } = this.state,
			milestoneIds = cloneObjectShallow(criteria.milestoneIds || []),
			index = milestoneIds.indexOf(milestone.id)
		
		if (index === -1) {
			milestoneIds.push(milestone.id)
		} else {
			milestoneIds.splice(index, 1)
		}
		
		this.setCriteria(cloneObjectShallow(criteria, { milestoneIds }))
	}
	
	/**
	 * Toggle a label on the issue filter
	 *
	 * @param label
	 */
	toggleIssueFilterLabel(label: Label) {
		let
			{ criteria } = this.state,
			labelIds = cloneObjectShallow(criteria.labelIds || []),
			index = labelIds.indexOf(label.id)
		
		if (index === -1) {
			labelIds.push(label.id)
		} else {
			labelIds.splice(index, 1)
		}
		
		this.setCriteria(cloneObjectShallow(criteria, { labelIds }))
		
	}
	
	
	/**
	 * Set filtering and sorting
	 *
	 * @param criteria
	 * @returns {(issueState:IssueState, getState:any)=>Map<(value:Map<any, any>)=>Map<any, any>, V>}
	 */
	
	setCriteria(criteria: IIssueCriteria = this.getCriteria()) {
		return this.updateCriteria(criteria)
	}
	
	setSearchText(searchText: string) {
		return this.updateState({ searchText })
	}
	
	
	toggleGroupVisibility = this.makeStateUpdate((id: string, visible: boolean) => {
		return (state: IssuesPanelState) => state.set('groupVisibility', state.groupVisibility.set(id, visible))
	})
	
	
	/**
	 * Update the filter to include closed and reload
	 *
	 * @param includeClosed
	 */
	includeClosedIssues(includeClosed: boolean) {
		this.setCriteria(cloneObjectShallow(this.getCriteria(), { includeClosed }))
	}
	
	
	getCriteria() {
		return this.state.criteria
	}
	
	getSort() {
		return this.getCriteria().sort
	}
	
	
	/**
	 * Set the current issue being edited
	 *
	 * @param editingIssue
	 * @param inline
	 * @return {(state:IssueState)=>Map<string, Issue>}
	 */
	
	setEditingIssue(editingIssue: Issue) {
		this.updateState({
			editingIssue
		})
	}
	
	/**
	 * Set whether or not inline editing is taking place
	 *
	 * @param inline
	 * @returns {(state:IssueState)=>Map<string, boolean>}
	 */
	setEditingInline(inline: boolean) {
		!inline && this.updateState({
			editInlineConfig: null,
			editingIssue: null
		})
	}
	
	/**
	 * Get the currently selected issue
	 *
	 * @returns {any}
	 */
	getSelectedIssue(): Issue {
		return this.selectors.selectedIssueSelector(getStoreState())
	}
	
	/**
	 * Get the selected issues
	 *
	 * @returns {List<Issue>}
	 */
	getSelectedIssues(): List<Issue> {
		return this.selectors.selectedIssuesSelector(getStoreState())
	}
	
	/**
	 * Get the selected issues
	 *
	 * @returns {List<Issue>}
	 */
	getSelectedIssueIds(): List<number> {
		return getValue(() => this.state.selectedIssueIds)
	}
	
	/**
	 * Get the selected issues
	 *
	 * @returns {List<Issue>}
	 */
	getItem(index: number): IIssueListItem<any> {
		return getValue(() => this.selectors.issueItemsSelector(getStoreState()).get(index), null)
	}
	
	
	/**
	 * Begin editing inline
	 *
	 * @returns {(dispatch:any, getState:any)=>undefined}
	 */
	
	editInline(fromIssue: Issue) {
		
		let
			items = this.selectors.issueItemsSelector(getStoreState()),
			index = fromIssue && items.findIndex(item => item.id === fromIssue.id)
		
		
		if (!fromIssue || isNil(index) || index === -1) {
			log.warn('Issue index not found', index)
			return
		}
		
		// Increment here to show the create below the current issue
		index++
		
		this.updateState({
			editingIssue: new Issue(cloneObject(_.pick(
				fromIssue,
				'repoId',
				'milestone',
				'labels',
				'assignee',
				'focused',
				'collaborators'
			), { state: 'open' })),
			editInlineConfig: {
				index,
				fromIssueId: fromIssue.id,
				fromIssue: cloneObjectShallow(fromIssue)
			}
		})
		
		
	}
	
	/**
	 * Set item indexes
	 *
	 * @param itemIndexes
	 */
	setItemIndexes = (itemIndexes:List<number>) => {
		this.updateState({
			itemIndexes
		})
	}
	
	/**
	 * Toggle View Horizontal/Vertical
	 */
	toggleView() {
		this.updateState({
			horizontalView: !this.getState().horizontalView
		})
	}
	
	/**
	 * Show a context menu for an issue
	 * @param issue
	 */
	showIssueContextMenu = (issue: Issue) => {
		if (!issue)
			return
		
		let
			selectedIssues = this.getSelectedIssues()
		
		if (!selectedIssues.find(it => it.id === issue.id)) {
			selectedIssues = List<Issue>([ issue ])
			this.setSelectedIssueIds(List<number>([ issue.id ]))
		}
		
		
		ContextMenu
			.create()
			.addLabel(selectedIssues.size === 1 ?
				`Issue #${issue.number} in ${issue.repo.full_name}` :
				`Issues: ${selectedIssues.map(it => `#${it.number}`).join(', ')}`
			)
			.addSeparator()
			
			.addCommand(`Edit Issue: #${issue.number} ${issue.title}`, () => getIssueActions().editIssue(issue))
			.addSeparator()
			
			.addCommand(
				Commands.LabelIssues,
				() => getIssueActions().patchIssuesLabel(selectedIssues)
			)
			.addCommand(
				Commands.MilestoneIssues,
				() => getIssueActions().patchIssuesLabel(selectedIssues)
			)
			.addCommand(
				Commands.AssignIssues,
				() => getIssueActions().patchIssuesAssignee(selectedIssues)
			)
			.addSeparator()
			.addCommand(
				Commands.ToggleFocusIssues,
				() => this.toggleSelectedAsFocused()
			)
			.addSeparator()
			.addCommand(
				Commands.CloseIssues,
				() => getIssueActions().setIssueStatus(selectedIssues, 'closed')
			)
			.popup()
		
		
	}
	
	
}

export default IssuesPanelController