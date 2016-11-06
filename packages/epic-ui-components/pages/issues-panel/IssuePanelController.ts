import { Map, Record, List } from "immutable"
import { OneAtATime } from "epic-global/Decorations"
import ViewState from "epic-typedux/state/window/ViewState"
import IssuesPanelState from "epic-ui-components/pages/issues-panel/IssuesPanelState"
import { isNumber, isNil, getValue } from "typeguard"
import { Issue } from "epic-models/Issue"
import { getUIActions, getIssueActions } from "epic-typedux/provider/ActionFactoryProvider"
import { cloneObjectShallow, cloneObject } from "epic-global/ObjectUtil"
import { DefaultIssueFilter } from "epic-typedux/state/issue/IIssueFilter"
import { Label } from "epic-models/Label"
import { Milestone } from "epic-models/Milestone"
import { addErrorMessage } from "epic-global/NotificationCenterClient"
import { TIssuePatchMode } from "epic-ui-components/pages/issues-panel/IssuesPanelState"
import { IssuesEvent } from "epic-models/IssuesEvent"
import { makeIssuesPanelStateSelectors } from "epic-ui-components/pages/issues-panel/IssuesPanelSelectors"
import { IssueActionFactory } from "epic-typedux/actions/IssueActionFactory"

/**
 * Created by jglanz on 11/5/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


type TIssuesPanelStateUpdater = (...args) => (state:IssuesPanelState) => any

/**
 * IssuePanelController
 *
 * @class IssuePanelController
 * @constructor
 **/
class IssuePanelController {
	
	
	selectors
	
	get viewState() {
		return this.selectors.viewStateSelector(getStoreState())
	}
	
	get state():IssuesPanelState {
		return getValue(() =>
			this.selectors.issuesPanelStateSelector(getStoreState()),
			this.initialState)
	}
	
	private makeViewStateUpdate<T extends TIssuesPanelStateUpdater>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				updatedState = stateUpdater(this.state) as IssuesPanelState
			
			if (updatedState === this.state) {
				log.debug(`No state update`, args)
				return
			}
			
			const
				newViewState = this.viewState.set('state',updatedState) as ViewState
			
			getUIActions().updateView(newViewState)
			
		}) as T
	}
	
	private updateState(patch:{[prop:string]:any}) {
		
		patch = cloneObjectShallow(patch)
		
		const
			keys = getValue(() => Object.keys(patch))
		
		if (!patch || !keys || !keys.length)
			return
		
		
		setImmediate(() => {
			let
				viewState = this.selectors
					.viewStateSelector(getStoreState())
			
			if (!viewState) {
				return log.warn('our view state does not exist',this.id)
			}
			const
				state = viewState.state.withMutations(newState => {
					for (let key of keys) {
						const
							newVal = patch[key]
						
						if (newState.get(key) !== newVal)
							newState = newState.set(key,newVal)
					}
					
					return newState
				}) as IssuesPanelState
			
			if (state !== this.state) {
				getUIActions().updateView(viewState.set('state',state))
			}
		})
	}
	
	
	constructor(public id:string, public initialState:IssuesPanelState = new IssuesPanelState()) {
		this.selectors = makeIssuesPanelStateSelectors(id)
		
		this.loadIssues()
		
	}
	
	/**
	 * Updates the current issues
	 */
	loadIssues = OneAtATime({},async () => {
		const
			{issueSort,issueFilter} = this.state,
			actions = new IssueActionFactory(),
			issues = await actions.queryIssues(issueSort,issueFilter)
		
		this.updateState({issues})
	})
	
	
	/**
	 * Update issues in the current panel
	 */
	private updateIssuesInState = this.makeViewStateUpdate((updatedIssues:List<Issue>) => {
		return (state:IssuesPanelState) => state.withMutations((newState:IssuesPanelState) => {
			let
				{ issues } = newState
			
			updatedIssues.forEach(updatedIssue => {
				const
					issueIndex = issues.findIndex(issue => issue.id === updatedIssue.id)
				
				issues = (issueIndex > -1) ?
					issues.set(issueIndex, updatedIssue) :
					issues.push(updatedIssue)
			})
			
			return newState.set('issues', issues)
		})
	})
	
	
	private filteringAndSorting = this.makeViewStateUpdate((issueFilter: IIssueFilter = null, issueSort: IIssueSort = null) =>
		(state: IssuesPanelState) => state.withMutations((newState: IssuesPanelState) => {
			
			if (issueFilter)
				newState.set('issueFilter', cloneObjectShallow(issueFilter))
			
			if (issueSort)
				newState.set('issueSort', cloneObjectShallow(issueSort))
			
			return newState
		}))
	
	
	setActivity(comments:List<Comment>,issuesEvents:List<IssuesEvent>) {
		this.updateState({
			comments,
			issuesEvents
		})
	}
	
	/**
	 * Create a new comment
	 */
	newComment() {
		const
			issue = this.selectors.selectedIssueSelector(getStoreState())
		
		if (!issue) {
			return addErrorMessage('You can only add a comment when exactly one issue is selected')
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
	
	private setIssues = this.makeViewStateUpdate((issues:List<Issue>) => (state:IssuesPanelState) => state.set(
			'issues',
			state.issues.withMutations(newIssues => {
				issues.forEach(issue => {
					const
						index = newIssues.findIndex(it => it.id === issue.id)
					
					newIssues = index === -1 ?
						newIssues.push(issue) :
						newIssues.set(index,issue)
					
				})
			})
		))
	
	
	
	
	/**
	 * Set the current focused issue ids
	 *
	 * @param focusedIssueIds
	 */
	
	setFocusedIssueIds(focusedIssueIds:List<number>) {
		this.updateState({
			focusedIssueIds
		})
	}
	
	
	
	private setPatchIssues(patchIssues: List<Issue>, patchMode: TIssuePatchMode = null) {
		this.updateState({
			patchIssues,
			patchMode: patchMode || this.state.patchMode
		})
		
	}
	
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
			editingInline: false
		})
		
		
	}
	
	/**
	 * Toggle selected as focused
	 */
	toggleSelectedAsFocused() {
		let
			{selectedIssueIds,focusedIssueIds = List<number>()} = this.state
		
		if (!selectedIssueIds || !selectedIssueIds.size)
			return
		
		// COPY
		focusedIssueIds = cloneObjectShallow(focusedIssueIds)
		
		if (selectedIssueIds.every(id => focusedIssueIds.includes(id))) {
			selectedIssueIds.forEach(id => {
				focusedIssueIds = focusedIssueIds.splice(focusedIssueIds.indexOf(id),1) as List<number>
			})
		} else {
			focusedIssueIds = focusedIssueIds.concat(selectedIssueIds) as List<number>
		}
		
		this.setFocusedIssueIds(focusedIssueIds)
		
	}
	
	/**
	 * Set focus on an issue
	 *
	 * @param issue
	 */
	focusOnIssue(issue:Issue)
	focusOnIssue(issueId:number)
	focusOnIssue(issueOrIssueId:Issue|number) {
		const
			issueId = isNumber(issueOrIssueId) ? issueOrIssueId : issueOrIssueId.id
		
		let
			{focusedIssueIds = List<number>()} = this.state
		
		if (focusedIssueIds.includes(issueId)) {
			log.debug(`Issue id ${issueId} is already focused`)
			return
		}
		
		this.setFocusedIssueIds(focusedIssueIds.push(issueId))
		
	}
	
	/**
	 * Remove issue focus
	 *
	 * @param issue
	 */
	removeIssueFocus(issue:Issue)
	removeIssueFocus(issueId:number)
	removeIssueFocus(issueOrIssueId:Issue|number) {
		const
			issueId = isNumber(issueOrIssueId) ? issueOrIssueId : issueOrIssueId.id
		
		let
			{focusedIssueIds = List<number>()} = this.state
		
		if (!focusedIssueIds.includes(issueId)) {
			log.debug(`Issue id ${issueId} does not have focus`)
			return
		}
		
		
		this.setFocusedIssueIds(
			focusedIssueIds
				.splice(
					focusedIssueIds.indexOf(issueId),
					1
				) as List<number>
		)
	}
	
	
	
	/**
	 * Clear all current issue filters
	 */
	clearFilters() {
		this.filteringAndSorting(DefaultIssueFilter)
	}
	
	/**
	 * Set the group by mode
	 *
	 * @param groupBy
	 */
	setGroupBy(groupBy: string) {
		const
			{issueSort} = this.state,
			newIssueSort: IIssueSort = cloneObjectShallow(issueSort,{
				groupBy
			})
		
		this.setFilteringAndSorting(null, newIssueSort)
	}
	
	/**
	 * Toggle ascending and descending grouping
	 */
	toggleGroupByDirection() {
		const
			issueSort = this.state.issueSort,
			newIssueSort: IIssueSort = cloneObjectShallow(issueSort,{
				groupByDirection: (issueSort.groupByDirection === 'asc') ?
					'desc' :
					'asc'
			})
		
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
	
	setFilteringAndSorting(
		issueFilter: IIssueFilter = this.getFilter(), issueSort: IIssueSort = this.getSort()
	) {
		return this.filteringAndSorting(issueFilter, issueSort)
	}
	
	
	toggleGroupVisibility = this.makeViewStateUpdate((id:string,visible:boolean) => {
		return (state:IssuesPanelState) => state.set('groupVisibility',state.groupVisibility.set(id,visible))
	})
	
	
	/**
	 * Update the filter to include closed and reload
	 *
	 * @param includeClosed
	 */
	includeClosedIssues(includeClosed: boolean) {
		const updatedFilter = assign(_.cloneDeep(this.state.issueFilter), {includeClosed})
		this.setFilteringAndSorting(updatedFilter)
	}
	
	
	getFilter() {
		return this.state.issueFilter
	}
	
	getSort() {
		return this.state.issueSort
	}
	
	
	
	
	
	
	/**
	 * Set the current issue being edited
	 *
	 * @param editingIssue
	 * @param inline
	 * @return {(state:IssueState)=>Map<string, Issue>}
	 */
	
	setEditingIssue(editingIssue: Issue, inline: boolean = false) {
		this.updateState({
			editingIssue,
			editingInline: inline
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
			exitInlineConfig: null,
			editingIssue: null
		})
	}
	
	getSelectedIssue():Issue {
		return this.selectors.selectedIssueSelector(getStoreState())
	}
	
	getSelectedIssues():List<Issue> {
		return this.selectors.selectedIssuesSelector(getStoreState())
	}
	
	private startEditInline(issue:Issue,fromIssueId,index:number) {
		this.updateState({
			editingInline: true,
			editingIssue: issue,
			editInlineConfig:{
				index,
				fromIssueId
			}
		})
		
	}
	
	/**
	 * Begin editing inline
	 *
	 * @returns {(dispatch:any, getState:any)=>undefined}
	 */
	
	editInline() {
		
			let
				items = this.selectors.issueItemsSelector(getStoreState()),
				selectedIssue = this.selectors.selectedIssueSelector(getStoreState()),
				index = selectedIssue && items.findIndex(item => item.id === selectedIssue.id)
			
			
			if (!selectedIssue || isNil(index) || index === -1) {
				log.warn('Issue index not found',index)
				return
			}
			
			// Increment here to show the create below the current issue
			index++
			
		
			const
				newIssue = new Issue(cloneObject(_.pick(
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

export default IssuePanelController