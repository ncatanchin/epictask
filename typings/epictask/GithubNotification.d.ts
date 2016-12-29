
declare type TGithubNotificationReason = 'assign'|'author'|'comment'|'invitation'|'manual'|'mention'|'state_change'|'subscribed'|'team_mention'

declare interface IGithubNotificationSubject {
	title?:string
	url?:string
	latest_comment_url?:string,
	type?:string
}

declare interface IGithubNotification {
	id?:number
	reason?:TGithubNotificationReason
	
	repository?:IRepo
	
	subject?:IGithubNotificationSubject
	
	last_read_at?:Date
	updated_at?:Date
	url?:string
}