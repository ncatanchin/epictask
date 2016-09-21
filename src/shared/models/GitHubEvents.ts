

import { Issue, Label, Repo, User } from "shared/models"
const 
	log = getLogger(__filename)


export namespace GithubEvents {
	
	export type TEventType = 'CommitCommentEvent'|	'CreateEvent'|	'DeleteEvent'|	'DeploymentEvent'|	'DeploymentStatusEvent'|	'DownloadEvent'|	'FollowEvent'|	'ForkEvent'|	'ForkApplyEvent'|	'GistEvent'|	'GollumEvent'|	'IssueCommentEvent'|	'IssuesEvent'|	'MemberEvent'|	'MembershipEvent'|	'PageBuildEvent'|	'PublicEvent'|	'PullRequestEvent'|	'PullRequestReviewCommentEvent'|	'PushEvent'|	'ReleaseEvent'|	'RepositoryEvent'|	'StatusEvent'|	'TeamAddEvent'|	'WatchEvent'
	
	export const EventTypes = {
		CommitCommentEvent: 'CommitCommentEvent',
		CreateEvent: 'CreateEvent',
		DeleteEvent: 'DeleteEvent',
		DeploymentEvent: 'DeploymentEvent',
		DeploymentStatusEvent: 'DeploymentStatusEvent',
		DownloadEvent: 'DownloadEvent',
		FollowEvent: 'FollowEvent',
		ForkEvent: 'ForkEvent',
		ForkApplyEvent: 'ForkApplyEvent',
		GistEvent: 'GistEvent',
		GollumEvent: 'GollumEvent',
		IssueCommentEvent: 'IssueCommentEvent',
		IssuesEvent: 'IssuesEvent',
		MemberEvent: 'MemberEvent',
		MembershipEvent: 'MembershipEvent',
		PageBuildEvent: 'PageBuildEvent',
		PublicEvent: 'PublicEvent',
		PullRequestEvent: 'PullRequestEvent',
		PullRequestReviewCommentEvent: 'PullRequestReviewCommentEvent',
		PushEvent: 'PushEvent',
		ReleaseEvent: 'ReleaseEvent',
		RepositoryEvent: 'RepositoryEvent',
		StatusEvent: 'StatusEvent',
		TeamAddEvent: 'TeamAddEvent',
		WatchEvent: 'WatchEvent'
	}
	
	
	/**
	 * Change shape
	 */
	export interface IChange {
		from?:string
		to?:string
	}
	
	/**
	 * Changes dictionary
	 */
	export interface IChanges {
		[field:string]:IChange
	}
	
	export interface IEventPayload {
		
	}
	
	export class RepoEvent<P extends IEventPayload> {
		id:string
		created_at:Date
		type:TEventType
		repo:Repo
		
		//noinspection ReservedWordAsName
		public:boolean
		actor:User
		org:User
		
		payload:P
		
		constructor(o:any = {}) {
			Object.assign(this,o,{
				created_at: new Date(o.created_at)
			})
		}
		
	}
	
	
	
	
	/**
	 * IssueEventAction type
	 */
	export type TIssueEventAction = 'assigned'|'unassigned'|'labeled'|'unlabeled'|'opened'|'edited'|'closed'|'reopened'
	
	
	/**
	 * IssueEventAction types
	 */
	export const IssueEventActions = { 
		assigned: 'assigned',
		unassigned:'unassigned',
		labeled:'labeled',
		unlabeled:'unlabeled',
		opened:'opened',
		edited:'edited',
		closed:'closed',
		reopened:'reopened'
	}
	
	
	
	
	/**
	 * Issues event
	 */
	export interface IIssuesEvent extends IEventPayload {
		action:TIssueEventAction
		issue:Issue
		changes?:IChanges
		label?:Label
		assignee?:User
	}
	
	
	/**
	 * IssueEventAction type
	 */
	export type TIssueCommentEventAction = 'created'|'edited'|'deleted'
	
	
	/**
	 * IssueEventAction types
	 */
	export const IssueCommentEventActions = {
		created: 'created',
		edited:'edited',
		deleted:'deleted'
	}
	
	/**
	 * Issues event
	 */
	export interface IIssueCommentEvent extends IEventPayload {
		action?:TIssueCommentEventAction
		issue?:Issue
		changes?:IChanges
		comment?:Comment
	}
	
	export type TIssueEventType = 'closed'|'reopened'|'subscribed'|'merged'|'referenced'|'mentioned'|'assigned'|'unassigned'|'labeled'|'milestoned'|'demilestoned'|'renamed'|'locked'|'unlocked'|'head_ref_deleted'|'head_ref_restored'
	
	export const IssueEventTypes = {
			closed:'closed',
		reopened:'reopened',
		subscribed:'subscribed',
		merged:'merged',
		referenced:'referenced',
		mentioned:'mentioned',
		assigned:'assigned',
		unassigned:'unassigned',
		labeled:'labeled',
		milestoned:'milestoned',
		demilestoned:'demilestoned',
		renamed:'renamed',
		locked:'locked',
		unlocked:'unlocked',
		head_ref_deleted:'head_ref_deleted',
		head_ref_restored:'head_ref_restored'
	}
	
	
	/**
	 * Events from the issue feed
	 */
	export class IssuesEvent {
		id:string
		url:string
		actor:User
		event:TIssueEventType
		commit_id:string
		commit_url:string
		created_at:Date
		rename:IChange
		issue:Issue
		
		constructor(o:any = {}) {
			Object.assign(this,o,{
				created_at: new Date(o.created_at)
			})
		}
		
	}
	
	
}


export default GithubEvents