
import {Map} from 'immutable'
import {IssueKey} from 'shared/Constants'

import {Issue} from 'shared/models/Issue'
import { IIssueFilter, IIssueSort, TIssueSortAndFilter, TEditCommentRequest } from 'shared/actions/issue/IssueState'
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
export const issuesSelector:(state) => Issue[] = (state):Issue[] => issueStateSelector(state).issues

/**
 * Select all current issue ids
 */
export const issueIdsSelector:(state) => number[] = (state):number[] => issueStateSelector(state).issues.map(issue => issue.id)


/**
 * Comments
 */
export const commentsSelector:(state) => Comment[] =
	(state):Comment[] => issueStateSelector(state).comments

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
	(selectedIssueId:number,issues:Issue[]) =>
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

/**
 * Filtered Issues
 */
export const filteredAndSortedIssueItemsSelector = createSelector(
	enabledRepoIdsSelector,
	issuesSelector,
	issueSortAndFilterSelector,
	(repoIds,issues:Issue[],{issueSort,issueFilter}):IIssueListItem<Issue>[] => {
		
		//log.info(`Filtering with issue items`, issues,issueSort,issueFilter)
		
		// If data not avail then return empty
		if (!issues || !Array.isArray(issues))
			return []

		

		// Get all the filters & sort criteria
		let
			{text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter,
			{fields:sortFields,direction:sortDirection} = issueSort

		milestoneIds = _.nilFilter(milestoneIds || [])
		labelUrls = _.nilFilter(labelUrls || [])
		assigneeIds = _.nilFilter(assigneeIds || [])

		let filteredIssues = issues
			
			// Filter by enabled repos (should already be filtered)
			
			
			// Filters
			.filter(issue => {
				
				// Repo & nil
				if (_.isNil(issue) || !repoIds.includes(issue.repoId))
					return false
				
				// Exact match
				if (issueId)
					return `${issue.id}` === `${issueId}`
				
				// Include Closed
				let matches = repoIds.includes(issue.repoId) &&
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

		filteredIssues = _.sortBy(filteredIssues,(o) => {
			let val = o[sortFields[0]]
			if (_.isString(val))
				val = _.toLower(val)

			return val
		})

		if (sortDirection === 'desc')
			filteredIssues = filteredIssues.reverse()

		return filteredIssues.map(issue => ({
			id: `issue-${issue.id}`,
			type: IssueListItemType.Issue,
			item: issue
		}))
	}
)

/**
 * List items
 */
export const issueItemsSelector = createSelector(
	issueSortAndFilterSelector,
	filteredAndSortedIssueItemsSelector,
	(issueSortAndFilter:TIssueSortAndFilter,issueItems:IIssueListItem<Issue>[]):IIssueListItem<any>[] => {
		
		
		
		const
			{issueSort} = issueSortAndFilter,
			{groupBy,groupByDirection} = issueSort
		
		//log.info(`Got issue items`, issueItems,groupBy)
		
		if (groupBy === 'none')
			return issueItems
		
		let
			allGroups = Array<IIssueGroup>()
		
		
		function newGroup(groupByItem) {
			return (allGroups[allGroups.length] = {
				id: getIssueGroupId({groupBy,groupByItem}),
				items: [],
				index: allGroups.length,
				size: 0,
				groupBy,
				groupByItem
			})
		}
		
		/**
		 *
		 * @param groupByItem
		 * @returns {{issueIds: Array, size: number, groupBy, groupByItem: any}}
		 */
		function getGroups(groupByItem):IIssueGroup[] {
			const groupId = getIssueGroupId({groupBy,groupByItem})
			
			const group = allGroups.find(item => item.id === groupId)
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
		
		for (let item of issueItems) {
			const
				issue = item.item as Issue,
				{milestone,labels,assignee} = issue,
				groupByItem = (groupBy === 'milestone') ? milestone :
					(groupBy === 'assignee') ? assignee :
						labels,
				
				
				groups = getGroups(groupByItem)
			
			groups.forEach(group => {
				group.size++
				group.items.push(item)
			})
			
		}
		
		// const sorters:{[key:string]:Function} = {
		// 	milestone: (o) => !o ? '' : _.toLower(o.title),
		// 	assignee: (o) => _.toLower(o.login),
		// 	labels: (o) => _.toLower(Array.isArray(o) ?
		// 		o.map(item => _.toLower(item.name))
		// 			.sort()
		// 			.join(',') :
		// 		o.name
		// 	),
		// }
		
		allGroups = _.sortBy(allGroups,'id')
		
		if (groupByDirection === 'desc')
			allGroups = allGroups.reverse()
		
		const allItems:IIssueListItem<any>[] = []
		
		// Iterate all groups and push group and group items to list
		allGroups.forEach(group => {
			
			allItems.push({
				id: group.id,
				type: IssueListItemType.Group,
				item: group
			},...issueItems)
			
		})
		
		return allItems
	}
)

