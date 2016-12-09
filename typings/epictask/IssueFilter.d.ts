


declare type TIssueSortDirection = 'asc'|'desc'

declare type TIssueFieldsGroupable = 'none'|'milestone'|'assignee'|'labels'|'repoIds'

declare type TIssueFieldsSortable = 'updated_at'|'created_at'|'repoId'|'title'|'assignee.login'|'focused'



declare interface IIssueSort {
	// fields to sort by
	fields:TIssueFieldsSortable[]
	
	// Label Urls
	direction:TIssueSortDirection
	
	// Group by field
	groupBy: TIssueFieldsGroupable
	
	// Group by field
	groupByDirection: TIssueSortDirection
	
}


declare interface IIssueFilter {
	// Milestone Ids
	milestoneIds?:number[]
	
	// Label Urls
	labelIds?:number[]
	
	// User ids
	assigneeIds?:number[]
	
	repoIds?:number[]
	
	includeClosed:boolean
	
	// Specific issue id
	issueId?:number
	
	text?:string
	
	offset:number
	
	limit:number
}


declare interface IIssueCriteria extends IIssueFilter {
	sort: IIssueSort
	exclude: IIssueFilter
}

