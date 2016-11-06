


declare interface IIssueFilter {
	// Milestone Ids
	milestoneIds?:number[]
	
	// Label Urls
	labelUrls?:string[]
	
	// User ids
	assigneeIds?:number[]
	
	includeClosed:boolean
	
	// Specific issue id
	issueId?:number
	
	text?:string
	
	offset:number
	
	limit:number
}

