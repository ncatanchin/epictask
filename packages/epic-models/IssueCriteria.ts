

import { cloneObject } from "epic-global"



export const IssueCriteriaKeywords = {
	groupKeywords: [ 'milestone', 'assignee', 'repo', 'label' ],
	groupKeywordsToFields: {
		'milestone': 'milestone',
		'assignee': 'assignee',
		'label': 'labels',
		'repo': 'repos'
	},
	sortKeywords: [ 'updated', 'created', 'repo', 'title', 'assignee','focused' ],
	sortKeywordsToFields: {
		'updated': 'updated_at',
		'created': 'created_at',
		'assignee': 'assignee.login',
		'title': 'title',
		'repo': 'repoId',
		'focused': 'focused'
	},
	directionKeywords: [ 'asc', 'desc' ],
	closedKeywords: [ 'closed' ],
}

export const IssueSortableFields = ['updated_at','created_at','repoId','title','assignee']
export const IssueSortableFieldNames = ['Last Updated','Created At','Repository','Alphabetically','Assignee']



export const IssueGroupByFields = ['none',...IssueCriteriaKeywords.groupKeywords]
export const IssueGroupByNames = ['No Grouping','Milestone','Assignee','Repo','Labels']



export const DefaultIssueSort = {
	fields:['created_at'],
	direction: 'desc',
	groupBy: 'none',
	groupByDirection: 'desc'
} as IIssueSort


export const DefaultIssueFilter = {
	offset:0,
	limit:100,
	includeClosed: false
} as IIssueFilter

export const DefaultIssueCriteria = cloneObject(
	DefaultIssueFilter,
	{sort: DefaultIssueSort}
) as IIssueCriteria