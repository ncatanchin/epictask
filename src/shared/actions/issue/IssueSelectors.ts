
import {Map,List} from 'immutable'
import {IssueKey} from 'shared/Constants'

import {Issue} from 'shared/models/Issue'
import { TIssueSortAndFilter, TEditCommentRequest } from 'shared/actions/issue/IssueState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'

import {IssueState} from 'shared/actions/issue/IssueState'
import {Comment} from 'shared/models/Comment'
import { IIssueGroup, getIssueGroupId, IssueListItemType, IIssueListItem } from './IIssueListItems'
import {TIssuePatchMode} from 'shared/actions/issue/IssueState'
import {
	enabledRepoIdsSelector,
	enabledMilestonesSelector, enabledLabelsSelector, enabledAssigneesSelector
} from "shared/actions/repo/RepoSelectors"
import { Label, Milestone, User } from "shared/models"
import {createSelector} from 'reselect'
import { IIssueSort, TIssueSortDirection, TIssueFieldsGroupable } from "shared/actions/issue/IIssueSort"
import { IIssueFilter } from "shared/actions/issue/IIssueFilter"
import { isListType } from "shared/util"

const log = getLogger(__filename)

/**
 * Get the current IssueState
 *
 * @param state
 * @return {IssueState}
 */
export const issueStateSelector = (state):IssueState => state.get(IssueKey) as IssueState

/**
 * Select all current issues
 */
export const issuesSelector:(state) => List<Issue> = createSelector(
	issueStateSelector,
	(state) => state.issues
)
	

/**
 * Select all current issues
 */
export const issueIndexesSelector:(state) => List<number> = createSelector(
	issueStateSelector,
	(state) => state.issueIndexes
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
 * Comments
 */
export const commentsSelector:(state) => List<Comment> =
	(state) => issueStateSelector(state).comments

/**
 * Issue sort and filter selector
 *
 * @param state
 * @return TIssueSortAndFilter
 */
export const issueSortAndFilterSelector:(state) => TIssueSortAndFilter = (state):{issueSort:IIssueSort,issueFilter:IIssueFilter} => {
	const issueState = state.get(IssueKey) as IssueState
	return _.pick(issueState,'issueFilter','issueSort') as any
}




/**
 * Global selector for selectedIssues changed
 *
 * @param state
 * @return Map<string,any>
 */
export const selectedIssueIdsSelector = createSelector(
	(state:Map<string,any>) => (state.get(IssueKey) as IssueState).selectedIssueIds,
	(selectedIssueIds:number[]) => selectedIssueIds
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
export const selectedIssueSelector = createSelector(
	selectedIssueIdSelector,
	issuesSelector,
	(selectedIssueId:number,issues:List<Issue>):Issue =>
	selectedIssueId && issues && issues.find(it => it.id === selectedIssueId)
)




/**
 * All issues currently being patched
 */
export const patchIssuesSelector = (state):Issue[] => (state.get(IssueKey) as IssueState).patchIssues

/**
 * Current patch mode
 */
export const patchModeSelector = (state):TIssuePatchMode => (state.get(IssueKey) as IssueState).patchMode

/**
 * Issue currently being edited
 */
export const editingIssueSelector = (state):Issue => (state.get(IssueKey) as IssueState).editingIssue

/**
 * Comment currently being edited
 */
export const editCommentRequestSelector = (state):TEditCommentRequest => (state.get(IssueKey) as IssueState).editCommentRequest


/**
 * Label filters
 */
export const issueFilterLabelsSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	enabledLabelsSelector,
	(issueSortAndFilter:TIssueSortAndFilter,labels:Label[]) => {
		const
			{issueFilter} = issueSortAndFilter,
			labelUrls = issueFilter.labelUrls || []

		return _.nilFilter(labelUrls.map(url => labels.find(label => label.url === url)))
	}
)

/**
 * Milestone filters
 */
export const issueFilterMilestonesSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	enabledMilestonesSelector,
	(issueSortAndFilter:TIssueSortAndFilter,milestones:Milestone[]) => {
		const
			{issueFilter} = issueSortAndFilter,
			milestoneIds = issueFilter.milestoneIds || []
		
		
		return _.nilFilter(
			milestoneIds.map(id => milestones.find(it => it.id === id)))
	}
)

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
	issueIndexesSelector,
	issueSortAndFilterSelector,
	enabledAssigneesSelector,
	(issues:List<Issue>, issueIndexes, {issueSort,issueFilter}):List<number> => {
		
		const
			{groupBy} = issueSort,
			{fields:sortFields,direction:sortDirection} = issueSort,
			isReverse = sortDirection === 'desc'
		
		// If data not avail then return empty
		if (!issues || !isListType(issues,Issue))
			return List<number>()
		
		// Get all the filters & sort criteria
		let
			{text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter
			
		
		milestoneIds = _.nilFilter(milestoneIds || [])
		labelUrls = _.nilFilter(labelUrls || [])
		assigneeIds = _.nilFilter(assigneeIds || [])
		
		const
			filteredIndexes = issueIndexes
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
					matches = issue.labels && labelUrls.some(url => issue.labels.findIndex(label => label.url === url) > -1)
				
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
				})
		
		if (isReverse)
			sortedIssueIndexes = sortedIssueIndexes.reverse()
		
		return sortedIssueIndexes
		
		
	}
)


/**
 * List items
 */
export const issueGroupsSelector = createSelector(
	groupBySelector,
	issuesSelector,
	orderedIssueIndexesSelector,
	(groupBy:TIssueFieldsGroupable,issues:List<Issue>,issueIndexes:List<number>):List<IIssueGroup> => {
		
		
		
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
					issue = issues.get(issueIndex),
					{ milestone, labels, assignee } = issue,
					groupByItem = (groupBy === 'milestone') ? milestone :
						(groupBy === 'assignee') ? assignee :
							labels,
					
					
					groups = getGroups(groupByItem)
				
				groups.forEach(group => {
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

export const issueItemsSelector = createSelector(
	issuesSelector,
	orderedIssueIndexesSelector,
	issueGroupsSelector,
	(issues:List<Issue>,issueIndexes:List<number>,groups:List<IIssueGroup>):List<IIssueListItem<any>> =>  {
		
		
		
		if (!groups || groups.size === 0) {
			return issueIndexes.map(issueIndex => makeIssueListItem(issues.get(issueIndex))) as List<IIssueListItem<any>>
		} else {
			return List<IIssueListItem<any>>()
				.withMutations(allItems => {
					groups.forEach(group => {
						allItems.push(makeIssueListItem(group))
						
						group.issueIndexes.forEach((issueIndex) => makeIssueListItem(issues.get(issueIndex)))
					})
					
					return allItems
				})
		
		}
		
		
	}
)
