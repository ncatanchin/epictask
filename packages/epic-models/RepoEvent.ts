import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest,
	FinderResultArray
} from 'typestore'

import {
	PouchDBModel,
} from 'typestore-plugin-pouchdb'

import { isNumber} from "typeguard"


import { User} from "./User"
import { Repo} from "./Repo"
// import { Label} from "epic-models"
// import { Milestone } from "epic-models"


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
	
	assert(repoId && eventId,`RepoId ${repoId}, Event Id ${eventId} must all be valid`)
	return `${makeRepoEventPrefix(repoId)}${eventId}`
}


/**
 * Represents event from /repos/<repoName>/events
 */
@Scopes.Models.Register
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
	
	@Attribute({primaryKey:true})
	id:string
	
	@Attribute()
	repoId:number
	
	@Attribute()
	created_at:Date
	@Attribute()
	type:TRepoEventType
	@Attribute()
	repo:Repo
	
	//noinspection ReservedWordAsName
	@Attribute()
	public:boolean
	
	@Attribute()
	actor:User
	@Attribute()
	org:User
	
	payload:P
	
	
	constructor(o:any = {}) {
		super()
		
		Object.assign(this,o,{
			created_at: new Date(o.created_at)
		})
	}
	
}


export interface RepoEventStore extends TSRepo<RepoEvent<any>> {
	
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
	
}
