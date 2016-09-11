
import {Map} from 'immutable'
import {IssueKey} from 'shared/Constants'

import {Issue} from 'shared/models/Issue'
import { IIssueFilter, IIssueSort, TIssueSortAndFilter, TEditCommentRequest } from 'shared/actions/issue/IssueState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'

import {IssueState} from 'shared/actions/issue/IssueState'
import {Comment} from 'shared/models/Comment'
import {IIssueGroup, getIssueGroupId} from 'shared/actions/issue/IIssueGroup'
import {TIssuePatchMode} from 'shared/actions/issue/IssueState'


/**
 * Get the current IssueState
 *
 * @param state
 * @return {IssueState}
 */
export const issueStateSelector = (state):IssueState => state.get(IssueKey) as IssueState




/**
 * Issue sort and filter selector
 *
 * @param state
 * @return TIssueSortAndFilter
 */
export const issueSortAndFilterSelector:(state) => TIssueSortAndFilter = _.memoize((state):{issueSort:IIssueSort,issueFilter:IIssueFilter} => {
	const issueState = state.get(IssueKey) as IssueState
	return _.pick(issueState,'issueFilter','issueSort') as any
}) as any




/**
 * Global selector for selectedIssues changed
 *
 * @param state
 * @return Map<string,any>
 */
export const selectedIssueIdsSelector = createDeepEqualSelector(
	(state:Map<string,any>) => (state.get(IssueKey) as IssueState).selectedIssueIds,
	(selectedIssueIds:number[]) => selectedIssueIds
)


export const issuesGroupedSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	
	(issueSortAndFilter:TIssueSortAndFilter):IIssueGroup[] => {
		return []
		// const {issueSort} = issueSortAndFilter
		// if (issueSort.groupBy === 'none')
		// 	return []
		//
		// const {groupBy,groupByDirection} = issueSort
		//
		// let allGroups = Array<IIssueGroup>()
		//
		//
		// function newGroup(groupByItem) {
		// 	return (allGroups[allGroups.length] = {
		// 		id: getIssueGroupId({groupBy,groupByItem}),
		// 		issues: [],
		// 		index: allGroups.length,
		// 		size: 0,
		// 		groupBy,
		// 		groupByItem
		// 	})
		// }
		//
		// /**
		//  *
		//  * @param groupByItem
		//  * @returns {{issueIds: Array, size: number, groupBy, groupByItem: any}}
		//  */
		// function getGroups(groupByItem):IIssueGroup[] {
		// 	const groupId = getIssueGroupId({groupBy,groupByItem})
		//
		// 	const group = allGroups.find(item => item.id === groupId)
		// 	return [group || newGroup(groupByItem)]
		//
		// 	// if (Array.isArray(groupByItem)) {
		// 	// 	return groupByItem.reduce((groups,nextGroupByItem) => {
		// 	// 		groups = groups.concat(getGroups(nextGroupByItem))
		// 	// 		return groups
		// 	// 	},[])
		// 	// } else {
		// 	// 	const group = allGroups.find(item => item.groupByItem === groupByItem)
		// 	// 	return [group || newGroup(groupByItem)]
		// 	// }
		// }
		//
		// for (let issue of issues) {
		// 	const {milestone,labels,assignee} = issue
		// 	const groupByItem = (groupBy === 'milestone') ? milestone :
		// 		(groupBy === 'assignee') ? assignee :
		// 			labels
		//
		//
		// 	const groups = getGroups(groupByItem)
		// 	groups.forEach(group => {
		// 		group.size++
		// 		group.issues.push(_.cloneDeep(issue))
		// 	})
		//
		// }
		//
		// // const sorters:{[key:string]:Function} = {
		// // 	milestone: (o) => !o ? '' : _.toLower(o.title),
		// // 	assignee: (o) => _.toLower(o.login),
		// // 	labels: (o) => _.toLower(Array.isArray(o) ?
		// // 		o.map(item => _.toLower(item.name))
		// // 			.sort()
		// // 			.join(',') :
		// // 		o.name
		// // 	),
		// // }
		//
		// allGroups = _.sortBy(allGroups,'id')
		//
		// if (groupByDirection === 'desc')
		// 	allGroups = allGroups.reverse()
		//
		// return allGroups
	}
)

export const patchIssuesSelector = _.memoize((state):Issue[] => (state.get(IssueKey) as IssueState).patchIssues)
export const patchModeSelector = _.memoize((state):TIssuePatchMode => (state.get(IssueKey) as IssueState).patchMode)

/**
 * Issue currently being edited
 */
export const editingIssueSelector = _.memoize((state):Issue => (state.get(IssueKey) as IssueState).editingIssue)

/**
 * Comment currently being edited
 */
export const editCommentRequestSelector = _.memoize((state):TEditCommentRequest => (state.get(IssueKey) as IssueState).editCommentRequest)



//
// /**
//  * Labels for enabled repos
//  *
//  * @return Label[]
//  */
// export const labelsSelector = createDeepEqualSelector(
// 	enabledRepoIdsSelector,
// 	labelModelsSelector,
// 	(repoIds:number[],models:Map<string,Label>):Label[] => {
//
// 		return models.valueSeq()
// 			.filter(item => repoIds.includes(item.repoId))
// 			.toArray()
// 	}
// )
//
// export const issueFilterLabelsSelector = createDeepEqualSelector(
// 	issueSortAndFilterSelector,
// 	labelModelsSelector,
// 	(issueSortAndFilter:TIssueSortAndFilter,models:Map<string,Label>) => {
// 		const
// 			{issueFilter} = issueSortAndFilter,
// 			labelUrls = issueFilter.labelUrls || []
//
// 		return labelUrls.map(url => models.get(url))
// 	}
// )
//
// export const issueFilterMilestonesSelector = createDeepEqualSelector(
// 	issueSortAndFilterSelector,
// 	milestoneModelsSelector,
// 	(issueSortAndFilter:TIssueSortAndFilter,models:Map<string,Milestone>) => {
// 		const
// 			{issueFilter} = issueSortAndFilter,
// 			milestoneIds = issueFilter.milestoneIds || []
//
// 		return milestoneIds.map(id => models.get(`${id}`))
// 	}
// )
//
// export const issuesSelector = createDeepEqualSelector(
// 	enabledRepoIdsSelector,
// 	issueIdsSelector,
// 	modelsSelector,
// 	issueSortAndFilterSelector,
// 	(repoIds,issueIds:number[],models,{issueSort,issueFilter}):Issue[] => {
// 		const {repoModels,labelModels,milestoneModels,issueModels} = models
//
// 		// If data not avail then return empty
// 		if (!issueModels || !issueIds || !repoIds)
// 			return []
//
// 		const issues:Issue[] =
// 			issueIds.map(id => issueModels.get(`${id}`))
// 				.filter(issue => !_.isNil(issue) && repoIds.includes(issue.repoId))
//
// 		let {text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter,
// 			{fields:sortFields,direction:sortDirection} = issueSort
//
// 		milestoneIds = _.nilFilter(milestoneIds || [])
// 		labelUrls = _.nilFilter(labelUrls || [])
// 		assigneeIds = _.nilFilter(assigneeIds || [])
//
// 		let filteredIssues = issues
// 			.filter(issue => {
// 				if (issueId)
// 					return `${issue.id}` === `${issueId}`
//
// 				let matches = repoIds.includes(issue.repoId) &&
// 					(issue.state === 'open' ||
// 					issueFilter.includeClosed)
//
// 				if (matches && milestoneIds.length)
// 					matches = issue.milestone && milestoneIds.includes(issue.milestone.id)
//
// 				if (matches && labelUrls.length)
// 					matches = issue.labels && labelUrls.some(url => issue.labels.findIndex(label => label.url === url) > -1)
//
// 				if (matches && assigneeIds.length)
// 					matches = issue.assignee && assigneeIds.includes(issue.assignee.id)
//
// 				if (matches && text)
// 					matches = _.toLower(issue.title + issue.body + _.get(issue.assignee,'login')).indexOf(_.toLower(text)) > -1
//
// 				return matches
// 			})
//
// 		filteredIssues = _.sortBy(filteredIssues,(o) => {
// 			let val = o[sortFields[0]]
// 			if (_.isString(val))
// 				val = _.toLower(val)
//
// 			return val
// 		})
//
// 		if (sortDirection === 'desc')
// 			filteredIssues = filteredIssues.reverse()
//
// 		return filteredIssues
// 			.map(issue => new Issue(assign({},issue,{
// 				repo: issue.repo || repoModels.get(`${issue.repoId}`) || repoModels.get(issue.repoId),
// 				labels: (!issue.labels) ? [] : issue.labels.map(label => labelModels.get(label.url)),
// 				milestone: (!issue.milestone) ? null : milestoneModels.get(`${issue.milestone.id}`)
// 			})))
// 	}
// )
//
