
import {
	Attribute,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest,
} from 'typestore'
import {Map} from 'immutable'

import {
	PouchDBModel,
} from 'typestore-plugin-pouchdb'



import { isNumber} from "typeguard"


import { User} from "./User"
import { Issue} from "./Issue"
import { RepoEvent,IEventPayload, IChanges, IChange } from "./RepoEvent"



const
	log = getLogger(__filename)

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
	label?
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

export type TIssueEventType = 'closed'|'reopened'|'subscribed'|'merged'|'referenced'|'mentioned'|'assigned'|'unassigned'|'unlabeled'|'labeled'|'milestoned'|'demilestoned'|'renamed'|'locked'|'unlocked'|'head_ref_deleted'|'head_ref_restored'

export const IssueEventTypes:{[type:string]:TIssueEventType} = {
	closed:'closed',
	reopened:'reopened',
	subscribed:'subscribed',
	merged:'merged',
	referenced:'referenced',
	mentioned:'mentioned',
	assigned:'assigned',
	unassigned:'unassigned',
	labeled:'labeled',
	unlabeled:'unlabeled',
	milestoned:'milestoned',
	demilestoned:'demilestoned',
	renamed:'renamed',
	locked:'locked',
	unlocked:'unlocked',
	head_ref_deleted:'head_ref_deleted',
	head_ref_restored:'head_ref_restored'
}

const
	{
		closed,
		reopened,
		subscribed,
		merged,
		referenced,
		mentioned,
		assigned,
		unassigned,
		unlabeled,
		labeled,
		milestoned,
		demilestoned,
		renamed,
		locked,
		unlocked,
		head_ref_deleted,
		head_ref_restored
	} = IssueEventTypes

export type TIssueEventGroupType = 'issue-reopened' | 'issue-closed' | 'pencil' | 'milestone' | 'tag' | 'person' | 'mention' | 'none'

export type TIssueEventGroupTypes = Map<TIssueEventGroupType,TIssueEventType[]>

/**
 * Event type groups
 */
export const IssueEventTypeGroups:TIssueEventGroupTypes = Map<TIssueEventGroupType,TIssueEventType[]>({
	'issue-reopened': [reopened],
	'issue-closed': [closed],
	'pencil': [renamed],
	'milestone': [milestoned,demilestoned],
	'tag': [labeled,unlabeled],
	'person': [assigned,unassigned],
	'mention': [referenced,mentioned,subscribed],
	'none': [locked,unlocked,head_ref_deleted,head_ref_restored,merged]
})


export function getEventGroupType(event:IssuesEvent) {
	return IssueEventTypeGroups.findKey((eventTypes) => eventTypes.includes(event.event))
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
	assert(repoId && issueNumber,`RepoId ${repoId} & issueNumber ${issueNumber} must all be valid`)
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
	
	const
		isValid = repoId && eventId && issueNumber
	
	if (DEBUG && !isValid)
		debugger
	
	assert(isValid,`RepoId ${repoId}, Event Id ${eventId} & issueNumber ${issueNumber} must all be valid`)
	return `${makeIssuesEventPrefix(repoId,issueNumber)}${eventId}`
}


/**
 * Represents event from /repos/<repoName>/issues/events
 */
@Scopes.Models.Register
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
	
	@Attribute({primaryKey:true})
	id:number
	@Attribute()
	repoId:number
	@Attribute()
	url:string
	@Attribute()
	actor:User
	@Attribute()
	event:TIssueEventType
	@Attribute()
	commit_id:string
	@Attribute()
	commit_url:string
	@Attribute()
	created_at:Date
	@Attribute()
	rename:IChange
	@Attribute()
	issue:Issue
	
	@Attribute()
	label
	
	@Attribute()
	milestone
	
	@Attribute()
	assignee:User
	
	@Attribute()
	assigner:User
	
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
export interface IssuesEventStore extends TSRepo<IssuesEvent> {
	
	
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
	
	
}



export default {
	RepoEvent,
	IssuesEvent
}