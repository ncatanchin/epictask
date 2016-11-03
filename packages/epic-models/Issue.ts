import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest
} from 'typestore'
import {PouchDBModel} from 'typestore-plugin-pouchdb'

//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Repo} from './Repo'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'

import {RegisterModel} from 'epic-global'
import { isNumber, isObjectType, isObject } from  "epic-global"





export function makeIssuePrefix(repoOrRepoId:number|Repo) {
	const
		repoId = (isNumber(repoOrRepoId)) ? repoOrRepoId : repoOrRepoId.id
	
	return `${repoId}-`
}

export function makeIssueId(issue:Issue)
export function makeIssueId(repo:Repo,issue:Issue)
export function makeIssueId(repoId:number,issueNumber:number)
export function makeIssueId(issueOrRepoOrRepoId:Issue|Repo|number,issueOrIssueNumber:Issue|number = null) {
	let repoId = -1, issueNumber = -1
	if (isObject(issueOrRepoOrRepoId) && _.get(issueOrRepoOrRepoId,'repoId')) {
		({repoId,number:issueNumber} = issueOrRepoOrRepoId as Issue)
	} else if (isObjectType(issueOrRepoOrRepoId,Repo) && isObjectType(issueOrIssueNumber,Issue)) {
		repoId = issueOrRepoOrRepoId.id
		issueNumber = issueOrIssueNumber.number
	} else if (isNumber(issueOrIssueNumber) && isNumber(issueOrRepoOrRepoId)) {
		repoId = issueOrRepoOrRepoId
		issueNumber = issueOrIssueNumber
	}


	return `${makeIssuePrefix(repoId)}${issueNumber}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeIssueId,
	onlyMapDefinedAttributes: true
	
})
export class Issue extends DefaultModel implements IIssue {

	static makeIssuePrefix = makeIssuePrefix
	
	static makeIssueId = makeIssueId
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof Issue ? o : new Issue(o)

	@Attribute({primaryKey:true})
	id: number;

	@Attribute()
	repoId:number

	/**
	 * Globally unique url to view the issue
	 */
	@Attribute()
	url: string;


	/**
	 * Associated repo
	 *
	 * @transient
	 */
	@Attribute({transient:true})
	repo:Repo


	/**
	 * Milestones
	 *
	 * @transient
	 */
	@Attribute({transient:true})
	milestones:Milestone[]

	/**
	 * Collaborators
	 *
	 * @transient
	 */
	@Attribute({transient:true})
	collaborators:User[]

	/**
	 * State open/closed
	 */
	@Attribute()
	state: TIssueState;

	
	repository_url: string;
	
	labels_url: string;
	
	comments_url: string;
	
	events_url: string;
	
	html_url: string;
	
	@Attribute()
	number: number;
	
	@Attribute()
	title: string;
	
	@Attribute()
	body: string;
	
	@Attribute()
	user: User;
	
	@Attribute()
	labels: Label[];
	
	@Attribute()
	assignee: User;
	
	@Attribute()
	milestone: Milestone;
	
	@Attribute()
	locked: boolean;
	
	@Attribute()
	comments: number;
	
	@Attribute()
	pull_request: PullRequest;
	
	@Attribute()
	closed_at: any;
	
	@Attribute()
	created_at: Date;
	
	@Attribute()
	updated_at: Date;
	
	@Attribute()
	closed_by: User;


	constructor(props:any = {}) {
		super()
		
		Object.assign(this,props,{
			labels: !props.labels ? [] : props.labels.map(Label.fromJS),
			milestone: Milestone.fromJS(props.milestone),
			closed_by: User.fromJS(props.closed_by),
			user: User.fromJS(props.user),
			assignee: User.fromJS(props.assignee),
			collaborators: !props.collaborators ? [] : props.collaborators.map(User.fromJS)
		})
	}
}


/**
 * Repository for accessing repos
 */
export interface IssueStore extends TSRepo<Issue> {
	
	
	/**
	 * Find all issues in provided repo id
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Issue[]>}
	 */
	findByIssuePrefix(request:FinderRequest,repoId:number):Promise<Issue[]>
	
	/**
	 * Same as above - just reverse order - better for
	 * loading in display
	 *
	 * @param request
	 * @param repoId
	 * @returns {null}
	 */
	findByIssuePrefixReverse(request:FinderRequest,repoId:number):Promise<Issue[]>
	
	/**
	 * Find all issues in provided repo id
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Issue[]>}
	 */
	findIdsByIssuePrefix(repoId:number):Promise<string[]>
	
}

/**
 * Apply an update to an issue
 *
 * @param issue
 * @param newIssue
 * @param sources - any additional objects to assign
 * @returns {any}
 */
export function applyIssueUpdate(issue:Issue,newIssue:Issue,...sources:any[]) {
	return assign(newIssue, issue || {}, newIssue,...sources)
}

/**
 * TypeGuard for Issue shape
 *
 * @param o
 * @returns {boolean}
 */
export function isIssue(o:any):o is Issue {
	return o.title && o.id && o.labels
}
