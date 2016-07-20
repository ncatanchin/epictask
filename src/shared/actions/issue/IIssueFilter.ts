
export interface IIssueFilter {
	// Milestone Ids
	milestoneIds?:number[]

	// Label Urls
	labelUrls?:string[]

	// User ids
	assigneeIds?:number[]

	// Specific issue id
	issueId?:number

	text?:string

	offset:number

	limit:number
}


