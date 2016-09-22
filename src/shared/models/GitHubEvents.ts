import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest,
	FinderResultArray
} from 'typestore'
import {
	PouchDBMangoFinder,
	PouchDBPrefixFinder,
	PouchDBModel,
	makePrefixEndKey
} from 'typestore-plugin-pouchdb'


import { Issue, Label, Repo, User } from "shared/models"
import { RegisterModel } from "shared/Registry"
import { isNumber } from "shared/util/ObjectUtil"

const
	log = getLogger(__filename)

export type TRepoEventType = 'CommitCommentEvent'|	'CreateEvent'|	'DeleteEvent'|	'DeploymentEvent'|	'DeploymentStatusEvent'|	'DownloadEvent'|	'FollowEvent'|	'ForkEvent'|	'ForkApplyEvent'|	'GistEvent'|	'GollumEvent'|	'IssueCommentEvent'|	'IssuesEvent'|	'MemberEvent'|	'MembershipEvent'|	'PageBuildEvent'|	'PublicEvent'|	'PullRequestEvent'|	'PullRequestReviewCommentEvent'|	'PushEvent'|	'ReleaseEvent'|	'RepositoryEvent'|	'StatusEvent'|	'TeamAddEvent'|	'WatchEvent'

export const RepoEventTypes = {
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

/**
 * Create a search prefix for a repo event
 *
 * @param repo
 */
export function makeRepoEventPrefix(repo:Repo)
export function makeRepoEventPrefix(repoId:number)
export function makeRepoEventPrefix(repoOrRepoId:number|Repo) {
	let
		repoId = (isNumber(repoOrRepoId)) ? repoOrRepoId : repoOrRepoId.id
	
	return `${repoId}-`
	
}

/**
 * Create a repo event id
 *
 * @param repoId
 * @param eventId
 */
export function makeRepoEventId(repoId:number,eventId:string)
/**
 * Create a repo event id
 *
 * @param repoEvent
 */
export function makeRepoEventId(repoEvent:RepoEvent<any>)
export function makeRepoEventId(repoEventOrRepoId:number|RepoEvent<any>,eventId:string = null) {
	let
		repoId:number
	
	if (isNumber(repoEventOrRepoId)) {
		repoId = repoEventOrRepoId
	} else {
		repoId = repoEventOrRepoId.repo.id
		eventId = repoEventOrRepoId.id
	}
	
	return `${makeRepoEventPrefix(repoId)}${eventId}`
}


/**
 * Represents event from /repos/<repoName>/events
 */
@RegisterModel
@PouchDBModel({
	keyMapper: makeRepoEventId
})
export class RepoEvent<P extends IEventPayload> extends DefaultModel {
	
	/**
	 * Revive from standard Object
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new RepoEvent<any>(o)
	
	/**
	 * Create search prefix
	 */
	static makeSearchPrefix = makeRepoEventPrefix
	
	/**
	 * Create ID
	 */
	static makeId = makeRepoEventId
	
	@AttributeDescriptor({primaryKey:true})
	id:string
	
	@AttributeDescriptor()
	repoId:number
	
	@AttributeDescriptor()
	created_at:Date
	@AttributeDescriptor()
	type:TRepoEventType
	@AttributeDescriptor()
	repo:Repo
	
	//noinspection ReservedWordAsName
	@AttributeDescriptor()
	public:boolean
	@AttributeDescriptor()
	actor:User
	@AttributeDescriptor()
	org:User
	
	payload:P
	
	
	constructor(o:any = {}) {
		super()
		
		Object.assign(this,o,{
			created_at: new Date(o.created_at)
		})
	}
	
}


export class RepoEventStore extends TSRepo<RepoEvent<any>> {
	
	constructor() {
		super(RepoEventStore,RepoEvent)
	}
	
	
	/**
	 * Find all events for a specific repo
	 *
	 * @param finderRequest
	 * @param repo
	 */
	findByRepo(finderRequest:FinderRequest,repo:Repo):Promise<RepoEvent<any>[]>
	
	/**
	 * Find all events with repo id
	 *
	 * @param finderRequest
	 * @param repoId
	 */
	findByRepo(finderRequest:FinderRequest,repoId:number):Promise<RepoEvent<any>[]>
	
	@PouchDBPrefixFinder({
		includeDocs: true,
		keyProvider: (repoOrRepoId:Repo|number) => {
			
			// CHECK TYPES & ASSIGN
			const
				startKey = makeRepoEventPrefix(isNumber(repoOrRepoId) ? repoOrRepoId : repoOrRepoId.id)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByRepo(finderRequest:FinderRequest,repoOrRepoId:Repo|number):Promise<RepoEvent<any>[]> {
		return null
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
export interface IIssuesEventPayload extends IEventPayload {
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
export interface IIssueCommentEventPayload extends IEventPayload {
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
 * Create a issues event id
 *
 * @param repoId
 * @param issueNumber
 */
export function makeIssuesEventPrefix(repoId:number,issueNumber:number)
/**
 * Create a repo event id
 *
 * @param issue
 */
export function makeIssuesEventPrefix(issue:Issue)
export function makeIssuesEventPrefix(issueOrRepoId:Issue|number,issueNumber:number = null){
	let
		repoId:number
	
	if (isNumber(issueOrRepoId)) {
		repoId = issueOrRepoId
	} else {
		repoId = issueOrRepoId.repoId
		issueNumber = issueOrRepoId.number
	}
	
	return `${repoId}-${issueNumber}-`
}

/**
 * Create a issues event id
 *
 * @param repoId
 * @param issueNumber
 * @param eventId
 */
export function makeIssuesEventId(repoId:number,issueNumber:number,eventId:number)
/**
 * Create a repo event id
 *
 * @param event
 */
export function makeIssuesEventId(event:IssuesEvent)
export function makeIssuesEventId(eventOrRepoId:number|IssuesEvent,issueNumber:number = null,eventId:number = null) {
	let
		repoId:number
	
	if (isNumber(eventOrRepoId)) {
		repoId = eventOrRepoId
	} else {
		repoId = eventOrRepoId.repoId
		eventId = eventOrRepoId.id
		issueNumber = eventOrRepoId.issue.number
	}
	
	return `${makeIssuesEventPrefix(repoId,issueNumber)}${eventId}`
}


/**
 * Represents event from /repos/<repoName>/issues/events
 */
@RegisterModel
@PouchDBModel({
	keyMapper: makeIssuesEventId
})
export class IssuesEvent extends DefaultModel {
	
	/**
	 * Revive from Object
	 *
	 * @param o
	 */
	static fromJS = (o) => new IssuesEvent(o)
	
	static makeId = makeIssuesEventId
	
	static makePrefix = makeIssuesEventPrefix
	
	@AttributeDescriptor({primaryKey:true})
	id:number
	@AttributeDescriptor()
	repoId:number
	@AttributeDescriptor()
	url:string
	@AttributeDescriptor()
	actor:User
	@AttributeDescriptor()
	event:TIssueEventType
	@AttributeDescriptor()
	commit_id:string
	@AttributeDescriptor()
	commit_url:string
	@AttributeDescriptor()
	created_at:Date
	@AttributeDescriptor()
	rename:IChange
	@AttributeDescriptor()
	issue:Issue
	
	constructor(o:any = {}) {
		super()
		Object.assign(this,o,{
			created_at: new Date(o.created_at)
		})
	}
	
}

/**
 * Issue Events Store
 */
export class IssuesEventStore extends TSRepo<IssuesEvent> {
	
	constructor() {
		super(IssuesEventStore,IssuesEvent)
	}
	
	
	/**
	 * Find all events for a specific issue
	 *
	 * @param finderRequest
	 * @param issue
	 */
	findByIssue(finderRequest:FinderRequest,issue:Issue):Promise<IssuesEvent[]>
	
	/**
	 * Find all events with repo id and issue number
	 *
	 * @param finderRequest
	 * @param repoId
	 * @param issueNumber
	 */
	findByIssue(finderRequest:FinderRequest,repoId:number,issueNumber:number):Promise<IssuesEvent[]>
	
	@PouchDBPrefixFinder({
		includeDocs: true,
		keyProvider: (issueOrRepoId:Issue|number,issueNumber:number) => {
			
			// CHECK TYPES & ASSIGN
			issueNumber = isNumber(issueOrRepoId) ? issueNumber : issueOrRepoId.number
			
			const
				repoId = isNumber(issueOrRepoId) ? issueOrRepoId : issueOrRepoId.repoId,
				startKey = makeIssuesEventPrefix(repoId,issueNumber)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByIssue(finderRequest:FinderRequest,issueOrRepoId:Issue|number,issueNumber:number = null):Promise<IssuesEvent[]> {
		return null
	}
}



export default {
	RepoEvent,
	IssuesEvent
}