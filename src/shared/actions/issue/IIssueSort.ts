


export const IssueSortableFields = ['updated_at','created_at','repoId','title','assignee']
export const IssueSortableFieldNames = ['Last Updated','Created At','Repository','Alphabetically','Assignee']

export const IssueGroupByFields = ['none','milestone','assignee','labels']
export const IssueGroupByNames = ['No Grouping','Milestone','Assignee','Labels']

export type TIssueSortDirection = 'asc'|'desc'

export type TIssueFieldsGroupable = 'none'|'milestone'|'assignee'|'labels'

export type TIssueFieldsSortable = 'updated_at'|'created_at'|'repoId'|'title'|'assignee.login'



export interface IIssueSort {
	// fields to sort by
	fields:TIssueFieldsSortable[]

	// Label Urls
	direction:TIssueSortDirection

	// Group by field
	groupBy: TIssueFieldsGroupable

	// Group by field
	groupByDirection: TIssueSortDirection

}

export default IIssueSort
