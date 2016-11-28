


export const IssueSortableFields = ['updated_at','created_at','repoId','title','assignee']
export const IssueSortableFieldNames = ['Last Updated','Created At','Repository','Alphabetically','Assignee']

export const IssueGroupByFields = ['none','milestone','assignee','labels']
export const IssueGroupByNames = ['No Grouping','Milestone','Assignee','Labels']

export const DefaultIssueSort = {
	fields:['created_at'],
	direction:null,
	groupBy: 'none',
	groupByDirection: null
} as IIssueSort
