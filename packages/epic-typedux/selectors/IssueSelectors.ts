
import {Map,List} from 'immutable'
import * as moment from 'moment'

import {IssueKey,isNumber} from "epic-global"

import {Comment,Issue,Label, Milestone, User, IssuesEvent } from "epic-models"

import {createDeepEqualSelector,isListType, nilFilterList, nilFilter} from  "epic-common"



import {
	IIssueGroup, getIssueGroupId, IssueListItemType, IIssueListItem,
	IIssueItemGroupProps, EditIssueInlineIndex,IIssueFilter,
	TIssueEditInlineConfig,  IIssueSort,TIssueFieldsGroupable
	
} from '../state/issue'
import {IssueState,TIssuePatchMode,TIssueSortAndFilter, TEditCommentRequest, TIssueActivity} from "../state/IssueState"
import {
	enabledRepoIdsSelector,
	enabledMilestonesSelector, enabledLabelsSelector, enabledAssigneesSelector
} from "./RepoSelectors"

import {createSelector} from 'reselect'




const log = getLogger(__filename)

/**
 * Get the current IssueState
 *
 * @param state
 * @return {IssueState}
 */

export const issueStateSelector:(state) => IssueState = createSelector(
	(state:any) => state.get(IssueKey),
	(issueState:IssueState) => issueState
)




/**
 * Select all current issues
 */
export const issuesSelector:(state) => List<Issue> = createSelector(
	issueStateSelector,
	(state) => state.issues
)
	


/**
 * Select all current issue ids
 */
export const issueIdsSelector:(state) => number[] =
	createSelector(
		issuesSelector,
		(issues:List<Issue>) =>
			issues.map(issue => issue.id).toArray()
	)

/**
 * Group visibility
 */
export const groupVisibilitySelector:(state) => Map<string,boolean> = createSelector(
	issueStateSelector,
	(state) => state.groupVisibility
)

/**
 * Comments
 */
export const commentsSelector:(state) => List<Comment> = createSelector(
	issueStateSelector,
	(state:IssueState) => state.comments
)

export const activityLoadingSelector: (state) => boolean = createSelector(
	issueStateSelector,
	(state:IssueState) => state.activityLoading
)


export const issuesEventsSelector:(state) => List<IssuesEvent> = createSelector(
	issueStateSelector,
	(state:IssueState) => state.issuesEvents
)




export const issueSortSelector = createDeepEqualSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.issueSort
)


export const issueFilterSelector = createDeepEqualSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.issueFilter
)

export const issueFilterLabelsSelector = createDeepEqualSelector(
	issueFilterSelector,
	enabledLabelsSelector,
	(filter:IIssueFilter,labels:List<Label>):List<Label> =>
		labels.filter(label => filter && filter.labelUrls && filter.labelUrls.includes(label.url)) as any
)

export const issueFilterMilestonesSelector = createSelector(
	issueFilterSelector,
	enabledMilestonesSelector,
	(filter:IIssueFilter,milestones:List<Milestone>):List<Milestone> =>
		milestones.filter(milestone => filter && filter.milestoneIds && filter.milestoneIds.includes(milestone.id)) as any
)

/**
 * Issue sort and filter selector
 *
 * @param state
 * @return TIssueSortAndFilter
 */
export const issueSortAndFilterSelector:(state) => TIssueSortAndFilter = createDeepEqualSelector(
	issueSortSelector,
	issueFilterSelector,
	(issueSort:IIssueSort,issueFilter:IIssueFilter) => ({
		issueSort,
		issueFilter
	})
)



/**
 * Global selector for selectedIssues changed
 *
 * @param state
 * @return Map<string,any>
 */
export const selectedIssueIdsSelector = createSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.selectedIssueIds
)

/**
 * If a single issue is selected then get the id
 */
export const selectedIssueIdSelector = createDeepEqualSelector(
	selectedIssueIdsSelector,
	(selectedIssueIds:number[]) =>
		selectedIssueIds && selectedIssueIds.length === 1 && selectedIssueIds[0]
)

/**
 * If a single issue is selected then get the id
 */
export const selectedIssueSelector = createDeepEqualSelector(
	selectedIssueIdSelector,
	issuesSelector,
	(selectedIssueId:number,issues:List<Issue>):Issue =>
	selectedIssueId && issues && issues.find(it => it.id === selectedIssueId)
)


/**
 * If a single issue is selected then get the id
 */
export const selectedIssuesSelector:(state) => Issue[] = createSelector(
	selectedIssueIdsSelector,
	issuesSelector,
	(selectedIssueIds:number[],issues:List<Issue>):Issue[] =>
	selectedIssueIds && issues ?
		nilFilter(selectedIssueIds.map(id => issues.find(it => it.id === id))) :
		[]
)





/**
 * All issues currently being patched
 */
export const patchIssuesSelector:(state) => Issue[] = createSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.patchIssues
)

/**
 * Current patch mode
 */
export const patchModeSelector:(state) => TIssuePatchMode = createSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.patchMode
)

/**
 * Issue currently being edited
 */

export const editingIssueSelector:(state) => Issue = createSelector(
	issueStateSelector,
	(state:IssueState) => state.editingIssue
)


export const editingInlineIssueSelector: (state) => boolean = createSelector(
	issueStateSelector,
	(state:IssueState) => state.editingIssue && state.editingInline
)

export const editInlineConfigIssueSelector:(state) => TIssueEditInlineConfig = createSelector(
	issueStateSelector,
	(state:IssueState) => state.editInlineConfig && state.editingIssue && state.editInlineConfig
)

export const issueSavingSelector:(state) => boolean = createSelector(
	issueStateSelector,
	(state:IssueState) => state.issueSaving
)

export const issueSaveErrorSelector:(state) => Error = createSelector(
	issueStateSelector,
	(state:IssueState) => state.issueSaveError
)


/**
 * Comment currently being edited
 */
export const editCommentRequestSelector:(state) => TEditCommentRequest = createSelector(
	issueStateSelector,
	(issueState:IssueState) => issueState.editCommentRequest
)
//
//
// /**
//  * Label filters
//  */
// export const issueFilterLabelsSelector = createDeepEqualSelector(
// 	issueSortAndFilterSelector,
// 	enabledLabelsSelector,
// 	(issueSortAndFilter:TIssueSortAndFilter,labels:Label[]) => {
// 		const
// 			{issueFilter} = issueSortAndFilter,
// 			labelUrls = issueFilter.labelUrls || []
//
// 		return _.nilFilter(labelUrls.map(url => labels.find(label => label.url === url)))
// 	}
// )
//
// /**
//  * Milestone filters
//  */
// export const issueFilterMilestonesSelector = createDeepEqualSelector(
// 	issueSortAndFilterSelector,
// 	enabledMilestonesSelector,
// 	(issueSortAndFilter:TIssueSortAndFilter,milestones:Milestone[]) => {
// 		const
// 			{issueFilter} = issueSortAndFilter,
// 			milestoneIds = issueFilter.milestoneIds || []
//
//
// 		return _.nilFilter(
// 			milestoneIds.map(id => milestones.find(it => it.id === id)))
// 	}
// )

/**
 * All currently selected assignee filters
 */
export const issueFilterAssigneeSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	enabledAssigneesSelector,
	(issueSortAndFilter:TIssueSortAndFilter,assignees:User[]) => {
		const
			{issueFilter} = issueSortAndFilter,
			assigneeIds = issueFilter.assigneeIds || []
		
		
		return _.nilFilter(
			assigneeIds.map(id => assignees.find(it => it.id === id)))
	}
)


export const groupBySelector = createSelector(
	(state):TIssueFieldsGroupable => issueStateSelector(state).issueSort.groupBy,
	(groupBy:TIssueFieldsGroupable) => groupBy
)



/**
 * Filtered Issues
 */
export const orderedIssueIndexesSelector = createSelector(
	issuesSelector,
	issueSortAndFilterSelector,
	enabledAssigneesSelector,
	editInlineConfigIssueSelector,
	(issues:List<Issue>, {issueSort,issueFilter},assignees:List<User>,editInlineConfig:TIssueEditInlineConfig):List<number> => {
		
		const
			{groupBy} = issueSort,
			{fields:sortFields,direction:sortDirection} = issueSort,
			isReverse = sortDirection === 'desc'
		
		// If data not avail then return empty
		if (!issues || !isListType(issues,Issue))
			return List<number>()
		
		// Get all the filters & sort criteria
		let
			{text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter,
			inlineEditIndex = -1
			
		
		milestoneIds = _.nilFilter(milestoneIds || [])
		labelUrls = _.nilFilter(labelUrls || [])
		assigneeIds = _.nilFilter(assigneeIds || [])
		
		
		const
			filteredIndexes = issues
				.map((issue,index) => index)
				.filter(issueIndex => {
					
					const
						issue = issues.get(issueIndex)
					
					// Exact match
					if (issueId)
						return `${issue.id}` === `${issueId}`
					
					// Include Closed
					let matches =
						(issue.state === 'open' || issueFilter.includeClosed)
					
					// Milestones
					if (matches && milestoneIds.length)
						matches = issue.milestone && milestoneIds.includes(issue.milestone.id)
					
					// Labels
					if (matches && labelUrls.length)
						matches = issue.labels && labelUrls.some(url => issue.labels.findIndex(label => label && label.url === url) > -1)
					
					// Assignee
					if (matches && assigneeIds.length)
						matches = issue.assignee && assigneeIds.includes(issue.assignee.id)
					
					// Text
					if (matches && text)
						matches = _.toLower(issue.title + issue.body + _.get(issue.assignee,'login')).indexOf(_.toLower(text)) > -1
					
					return matches
				})
			
		
		let
			sortedIssueIndexes = filteredIndexes
				.sortBy((issueIndex) => {
					const
						issue = issues.get(issueIndex)
						
					let
						val = _.get(issue,sortFields[ 0 ])
					
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
				log.warn(`Unable to find inline issue index`,editInlineConfig)
			}
			
			// PUSH THE EDIT INLINE PLACEHOLDER INDEX
			else {
				sortedIssueIndexes = sortedIssueIndexes.insert(inlineIndex + 1, EditIssueInlineIndex)
			}
		}
		
		return sortedIssueIndexes as List<number>
		
		
	}
)


/**
 * List items
 */
export const issueGroupsSelector = createSelector(
	issueSortAndFilterSelector,
	issuesSelector,
	orderedIssueIndexesSelector,
	({issueSort},issues:List<Issue>,issueIndexes:List<number>):List<IIssueGroup> => {
		
		const
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
)


/**
 * Create issue group id selector (from props)
 */
export function makeIssueGroupIdSelector():(state,props) => string {
	return createSelector(
		(state, props:IIssueItemGroupProps) => props.group && props.group.id,
		(groupId) => groupId
	)
}

/**
 * Return a selector that determines whether a group is expanded or closed
 */
export function makeIssueGroupExpandedSelector() {
	return createDeepEqualSelector(
		groupVisibilitySelector,
		makeIssueGroupIdSelector(),
		(groupVisibility:Map<string,boolean>, groupId) =>
			groupVisibility.has(groupId) ? groupVisibility.get(groupId) : true
	)
}

/**
 * Make an issue list item
 *
 * @param item
 */
function makeIssueListItem(item:Issue|IIssueGroup):IIssueListItem<any> {
	return {
		id: item.id,
		type: (item as Issue).url ? IssueListItemType.Issue : IssueListItemType.Group,
		item
	}
}

/**
 * All issue items selector - fully sorted with groups
 */
export const issueItemsSelector = createSelector(
	issuesSelector,
	orderedIssueIndexesSelector,
	issueGroupsSelector,
	editInlineConfigIssueSelector,
	(issues:List<Issue>,issueIndexes:List<number>,groups:List<IIssueGroup>,editInlineConfig:TIssueEditInlineConfig):List<IIssueListItem<any>> =>  {
		
		// IF EDIT INLINE THEN CREATE ITEM, THE PLACEHOLDER WILL BE IN THE INDEXES
		function makeEditInlineItem():IIssueListItem<TIssueEditInlineConfig> {
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
)

/**
 * Selector for focused issue ids
 */
export const focusedIssueIdsSelector:(state) => number[] = createSelector(
	issueStateSelector,
	(state:IssueState) => state.focusedIssueIds
)

/**
 * All current issue activity
 */
export const activitySelector:(state) => TIssueActivity = createSelector(
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
