


declare interface IMilestone {
	
	
	
	id: number
	
	repoId:number
	
	url: string
	
	
	html_url: string
	
	labels_url: string
	
	number: number
	
	state: string
	
	title: string
	
	description: string
	
	creator: IUser
	
	open_issues: number
	
	closed_issues: number
	
	created_at: Date
	
	updated_at: Date
	
	closed_at: Date
	
	due_on: Date
}