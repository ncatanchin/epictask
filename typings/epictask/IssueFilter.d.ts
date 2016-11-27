
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
	text: string
	sort: IIssueSort
	exclude: IIssueFilter
}
