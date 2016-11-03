
declare interface IComment {
	id: number;
	
	
	repoId:number
	
	issueNumber:number
	
	url: string
	
	html_url: string
	issue_url:string
	
	body: string
	
	user: IUser
	
	created_at: Date
	
	updated_at: Date
	
}