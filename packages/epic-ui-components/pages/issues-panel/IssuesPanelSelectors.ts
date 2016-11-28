import { Map, List } from "immutable"
import { createDeepEqualSelector, isListType, isNumber } from "epic-global"
import {
	Comment,
	Issue,
	Label,
	Milestone,
	User,
	IssuesEvent,
	IIssueGroup,
	getIssueGroupId,
	IssueListItemType,
	IIssueListItem,
	IIssueItemGroupProps,
	EditIssueInlineIndex,
	IIssueEditInlineConfig
} from "epic-models"
//import {IssueState,TIssuePatchMode,TIssueSortAndFilter, TEditCommentRequest, TIssueActivity} from "epic-typedux/state/IssueState"
import {
	enabledMilestonesSelector,
	enabledLabelsSelector,
	enabledAssigneesSelector
} from "epic-typedux/selectors/RepoSelectors"
import { createSelector } from "reselect"
import { uiStateSelector } from "epic-typedux/selectors/UISelectors"
import IssuesPanelState, {
	TIssueSortAndFilter,
	TIssueActivity
} from "epic-ui-components/pages/issues-panel/IssuesPanelState"
import { UIState } from "epic-typedux/state/UIState"
import ViewState from "epic-typedux/state/window/ViewState"


const
	log = getLogger(__filename)

// GET THE ID FROM PROPS
const makeViewStateIdSelector = () => createSelector(
	(state,props) => props.viewStateId,
	viewStateId => viewStateId
)





export function makeIssuesPanelStateSelectors(id:string = null) {
	
	
		const
			viewStateIdSelector = id ? (() => id) : makeViewStateIdSelector(),
			viewStateSelector = createSelector(
				uiStateSelector,
				viewStateIdSelector,
				(uiState:UIState, viewStateId:string) =>
					uiState.viewStates.find(it => it.id === viewStateId)
			),
			issuesPanelStateSelector:TSelector<IssuesPanelState> = createSelector(
				viewStateSelector,
				(viewState:ViewState) =>
					viewState.state as IssuesPanelState
			),
			issuesEventsSelector:TSelector<List<IssuesEvent>> = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.events
			),
			groupVisibilitySelector:(state) => Map<string,boolean> = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.groupVisibility
			),
			
			issuesSelector:TSelector<List<Issue>> = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) =>
					state.issues || List<Issue>()
			),
			issueIdsSelector:TSelector<List<number>> = createSelector(
				issuesSelector,
				(issues) => issues.map(it => it.id) as List<number>
			),
			
			commentsSelector:TSelector<List<Comment>> = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.comments
			),
			
			criteriaSelector = createSelector(
				issuesPanelStateSelector,
				(issueState:IssuesPanelState) => issueState.criteria
			),
			
			searchTextSelector = createSelector(
				issuesPanelStateSelector,
				(issueState:IssuesPanelState) => issueState.searchText
			),
			
			issueFilterLabelsSelector = createSelector(
				criteriaSelector,
				enabledLabelsSelector,
				(filter:IIssueCriteria, labels:List<Label>):List<Label> =>
					labels.filter(label => filter && filter.labelIds && filter.labelIds.includes(label.id)) as any
			),
			issueFilterMilestonesSelector = createSelector(
				criteriaSelector,
				enabledMilestonesSelector,
				(filter:IIssueCriteria, milestones:List<Milestone>):List<Milestone> =>
					milestones.filter(milestone => filter && filter.milestoneIds && filter.milestoneIds.includes(milestone.id)) as any
			),
			selectedIssueIdsSelector = createSelector(
				issuesPanelStateSelector,
				(issueState:IssuesPanelState) => issueState.selectedIssueIds
			),
			
			selectedIssuesSelector:TSelector<List<Issue>> = createSelector(
				selectedIssueIdsSelector,
				issuesSelector,
				(selectedIssueIds,issues) =>
					!issues ?
						List<Issue>() :
						issues.filter(issue => issue && selectedIssueIds.includes(issue.id)) as List<Issue>
			),
			selectedIssueIdSelector = createSelector(
				selectedIssueIdsSelector,
				(selectedIssuesIds:List<number>) => selectedIssuesIds && selectedIssuesIds.size === 1 &&
				selectedIssuesIds.get(0)
			),
			
			hasSelectedIssuesSelector = createSelector(
				selectedIssueIdsSelector,
				(selectedIssueIds:List<number>) => selectedIssueIds && selectedIssueIds.size > 0
			),
			
			selectedIssueSelector = createDeepEqualSelector(
				selectedIssueIdSelector,
				issuesSelector,
				(selectedIssueId:number, issues:List<Issue>):Issue =>
				selectedIssueId && issues && issues.find(it => it.id === selectedIssueId)
			),
			
			// selectedIssuesSelector:TSelector<List<Issue>> = createSelector(
			// 	selectedIssueIdsSelector,
			// 	issuesSelector,
			// 	(selectedIssueIds:List<number>, issues:List<Issue>):List<Issue> =>
			// 		selectedIssueIds && issues ?
			// 			nilFilterList(selectedIssueIds.map(id => issues.find(it => it.id === id)) as any) :
			// 			List<Issue>()
			// ),
			
			
			//EDIT INLINE
			editingIssueSelector:(state) => Issue = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.editingIssue
			),
			editingInlineIssueSelector: (state) => boolean = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => !!state.editInlineConfig
			),
			editInlineConfigIssueSelector:(state) => IIssueEditInlineConfig = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.editInlineConfig && state.editingIssue && state.editInlineConfig
			),
			issueSavingSelector:(state) => boolean = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.saving
			),
			issueSaveErrorSelector:(state) => Error = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.saveError
			),
	
	
			issueFilterAssigneeSelector = createDeepEqualSelector(
				criteriaSelector,
				enabledAssigneesSelector,
				(issueFilter:IIssueCriteria, assignees:List<User>) => {
					const
						assigneeIds = issueFilter.assigneeIds || []
					
					
					return List<User>(_.nilFilter(
						assigneeIds.map(id => assignees.find(it => it.id === id))))
				}
			),
			groupBySelector = createSelector(
				criteriaSelector,
				(criteria:IIssueCriteria) => criteria.sort.groupBy
			),
			orderedIssueIndexesSelector = createSelector(
				issuesSelector,
				criteriaSelector,
				enabledAssigneesSelector,
				editInlineConfigIssueSelector,
				(issues:List<Issue>, criteria:IIssueCriteria, assignees:List<User>, editInlineConfig:IIssueEditInlineConfig):List<number> => {
					
					const
						issueSort = criteria.sort,
						{
							groupBy
						} = issueSort,
						{
							fields: sortFields,
							direction:sortDirection = 'desc'
						} = issueSort,
						isReverse = sortDirection === 'desc'
					
					
					
					// If data not avail then return empty
					if (!issues || !isListType(issues, Issue))
						return List<number>()
					
					// Get all the filters & sort criteria
					let
						{ text, issueId, milestoneIds, labelIds, assigneeIds } = criteria,
						inlineEditIndex = -1
					
					
					milestoneIds = _.nilFilter(milestoneIds || [])
					labelIds = _.nilFilter(labelIds || [])
					assigneeIds = _.nilFilter(assigneeIds || [])
					
					
					const
						filteredIndexes = issues
							.map((issue, index) => index)
							.filter(issueIndex => {
								
								const
									issue = issues.get(issueIndex)
								
								// Exact match
								if (issueId)
									return `${issue.id}` === `${issueId}`
								
								// Include Closed
								let matches =
									(issue.state === 'open' || criteria.includeClosed)
								
								// Milestones
								if (matches && milestoneIds.length)
									matches = issue.milestone && milestoneIds.includes(issue.milestone.id)
								
								// Labels
								if (matches && labelIds.length)
									matches = issue.labels && labelIds.some(id => issue.labels.findIndex(label => label && label.id === id) > -1)
								
								// Assignee
								if (matches && assigneeIds.length)
									matches = issue.assignee && assigneeIds.includes(issue.assignee.id)
								
								// Text
								if (matches && text)
									matches = _.toLower(issue.title + issue.body + _.get(issue.assignee, 'login')).indexOf(_.toLower(text)) > -1
								
								return matches
							})
					
					
					let
						sortedIssueIndexes = filteredIndexes
							.sortBy((issueIndex) => {
								const
									issue = issues.get(issueIndex)
								
								let
									val = _.get(issue, sortFields[ 0 ])
								
								if (_.isString(val))
									val = _.toLower(val)
								
								return val
							}) as List<number>
					
					if (isReverse)
						sortedIssueIndexes = sortedIssueIndexes.reverse() as List<number>
					
					// CHECK INLINE EDIT INDEX
					if (editInlineConfig) {
						const
							inlineIndex = sortedIssueIndexes.findIndex(issueIndex => issues.get(issueIndex).id === editInlineConfig.fromIssueId)
						
						if (inlineIndex === -1) {
							log.warn(`Unable to find inline issue index`, editInlineConfig)
						}
						
						// PUSH THE EDIT INLINE PLACEHOLDER INDEX
						else {
							sortedIssueIndexes = sortedIssueIndexes.insert(inlineIndex + 1, EditIssueInlineIndex)
						}
					}
					
					return sortedIssueIndexes as List<number>
					
					
				}
			),
			
			
			
			issueGroupsSelector = createSelector(
				criteriaSelector,
				issuesSelector,
				orderedIssueIndexesSelector,
				(criteria:IIssueCriteria,issues:List<Issue>,issueIndexes:List<number>):List<IIssueGroup> => {
					
					const
						issueSort = criteria.sort,
						groupBy = issueSort.groupBy
					
					
					//log.info(`Got issue items`, issueItems,groupBy)
					
					if (groupBy === 'none')
						return List<IIssueGroup>()
					
					return List<IIssueGroup>().withMutations(allGroups => {
						
						/**
						 * Create a new group
						 * @param groupByItem
						 */
						function newGroup(groupByItem) {
							
							const group = {
								id: getIssueGroupId({groupBy,groupByItem}),
								issueIndexes: [],
								index: allGroups.size,
								size: 0,
								groupBy: groupBy as TIssueFieldsGroupable,
								groupByItem
							}
							
							allGroups.push(group)
							
							return group
						}
						
						/**
						 * Get groups for a group by item
						 *
						 * @param groupByItem
						 */
						function getGroups(groupByItem):IIssueGroup[] {
							const
								groupId = getIssueGroupId({groupBy,groupByItem}),
								group = allGroups.find(item => item.id === groupId)
							
							return [group || newGroup(groupByItem)]
							
							// if (Array.isArray(groupByItem)) {
							// 	return groupByItem.reduce((groups,nextGroupByItem) => {
							// 		groups = groups.concat(getGroups(nextGroupByItem))
							// 		return groups
							// 	},[])
							// } else {
							// 	const group = allGroups.find(item => item.groupByItem === groupByItem)
							// 	return [group || newGroup(groupByItem)]
							// }
						}
						
						
						issueIndexes.forEach((issueIndex) => {
							const
								issue = issues.get(issueIndex)
							
							if (!issue) {
								log.warn(`No issue found at index ${issueIndex}`)
								return
							}
							
							const
								{ milestone, labels, assignee } = issue,
								groupByItem = (groupBy === 'milestone') ? milestone :
									(groupBy === 'assignee') ? assignee :
										_.nilFilter(labels)
							
							getGroups(groupByItem).forEach(group => {
								group.size++
								group.issueIndexes.push(issueIndex)
							})
						})
						
						// Iterate all groups and push group and group items to list
						return allGroups
					})
				}
			),
			
			
			/**
			 * Create issue group id selector (from props)
			 */
			makeIssueGroupIdSelector:() => TSelector<string> = () => createSelector(
				(state, props:IIssueItemGroupProps) => props.group && props.group.id,
				(groupId:string) => groupId
			),
			
			/**
			 * Return a selector that determines whether a group is expanded or closed
			 */
			makeIssueGroupExpandedSelector:TSelector<boolean> = () => createDeepEqualSelector(
				groupVisibilitySelector,
				makeIssueGroupIdSelector(),
				(groupVisibility:Map<string,boolean>, groupId:string) =>
					groupVisibility.has(groupId) ? groupVisibility.get(groupId) : true
			),
			
			/**
			 * Make an issue list item
			 *
			 * @param item
			 */
			makeIssueListItem = (item:Issue|IIssueGroup) =>({
				id: item.id,
				type: item.$$clazz === Issue.$$clazz ? IssueListItemType.Issue : IssueListItemType.Group,
				item
			}) as IIssueListItem<any>,
			
			/**
			 * All issue items selector - fully sorted with groups
			 */
			issueItemsSelector:TSelector<List<IIssueListItem<any>>> = createSelector(
				issuesSelector,
				orderedIssueIndexesSelector,
				issueGroupsSelector,
				editInlineConfigIssueSelector,
				(issues:List<Issue>,issueIndexes:List<number>,groups:List<IIssueGroup>,editInlineConfig:IIssueEditInlineConfig):List<IIssueListItem<any>> =>  {
					
					// IF EDIT INLINE THEN CREATE ITEM, THE PLACEHOLDER WILL BE IN THE INDEXES
					function makeEditInlineItem():IIssueListItem<IIssueEditInlineConfig> {
						return {
							type:IssueListItemType.EditIssueInline,
							id: EditIssueInlineIndex,
							item: editInlineConfig
						}
					}
					
					// GET ISSUE/EDIT/GROUP ITEM
					function getIssueListItem(issueIndex:number|Issue) {
						return (issueIndex === EditIssueInlineIndex && editInlineConfig) ?
							makeEditInlineItem() :
							makeIssueListItem(isNumber(issueIndex) ? issues.get(issueIndex) : issueIndex)
					}
					
					
					if (!groups || groups.size === 0) {
						return issueIndexes.map(issueIndex => getIssueListItem(issueIndex)) as List<IIssueListItem<any>>
					} else {
						return List<IIssueListItem<any>>()
							.withMutations(allItems => {
								groups.forEach(group => {
									allItems.push(makeIssueListItem(group))
									
									// Iterate all issues in group and add to all items in order
									// Also if editing inline then add extra item after matched fromIssueId
									group.issueIndexes.forEach((issueIndex) => {
										if (issueIndex === EditIssueInlineIndex)
											return
										
										const
											issue = issues.get(issueIndex)
										
										allItems.push(getIssueListItem(issue))
										
										// IF THIS IS THE ISSUE WE ARE CREATING FROM - INSERT THE EDIT INLINE PLACE HOLDER
										if (editInlineConfig && editInlineConfig.fromIssueId === issue.id) {
											log.info(`Adding edit inline place holder at `,issueIndex)
											allItems.push(getIssueListItem(EditIssueInlineIndex))
										}
									})
								})
								
								return allItems
							})
						
					}
					
					
				}
			),
			
			
			/**
			 * Selector for focused issue ids
			 */
			focusedIssueIdsSelector:(state) => List<number> = createSelector(
				issuesPanelStateSelector,
				(state:IssuesPanelState) => state.focusedIssueIds
			),
			
			/**
			 * All current issue activity
			 */
			activitySelector:(state) => TIssueActivity = createSelector(
				commentsSelector,
				issuesEventsSelector,
				selectedIssueSelector,
				
				(comments:List<Comment>,events:List<IssuesEvent>,selectedIssue:Issue) => {
					return {
						selectedIssue,
						comments,
						events: events.sortBy((event) => moment(event.created_at).valueOf()) as List<IssuesEvent>
					}
				}
			)
	
	
		
		
	return {
		viewStateIdSelector,
		viewStateSelector,
		issuesPanelStateSelector,
		issuesEventsSelector,
		groupVisibilitySelector,
		
		issuesSelector,
		issueIdsSelector,
		
		commentsSelector,
		criteriaSelector,
		searchTextSelector,
		
		issueFilterLabelsSelector,
		issueFilterMilestonesSelector,
		selectedIssueIdsSelector,
		selectedIssueIdSelector,
		
		selectedIssueSelector,
		hasSelectedIssuesSelector,
		
		selectedIssuesSelector,
		
		
		//EDIT INLINE
		editingIssueSelector,
		editingInlineIssueSelector,
		editInlineConfigIssueSelector,
		issueSavingSelector,
		issueSaveErrorSelector,
	
		
		
		issueFilterAssigneeSelector,
		groupBySelector,
		orderedIssueIndexesSelector,
		focusedIssueIdsSelector,
		
		
		issueGroupsSelector,
		makeIssueGroupIdSelector,
		
		/**
		 * Return a selector that determines whether a group is expanded or closed
		 */
		makeIssueGroupExpandedSelector,
		
		/**
		 * Make an issue list item
		 *
		 * @param item
		 */
		makeIssueListItem,
		
		/**
		 * All issue items selector - fully sorted with groups
		 */
		issueItemsSelector,
		
		/**
		 * All current issue activity
		 */
		activitySelector
	
	}
	
	
}



const
	typedSelectors = makeIssuesPanelStateSelectors()

export type TIssuesPanelSelectors = typeof typedSelectors




