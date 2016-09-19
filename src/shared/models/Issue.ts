import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest,
	FinderResultArray
} from 'typestore'
import {PouchDBFullTextFinder, PouchDBMangoFinder,PouchDBPrefixFinder,PouchDBModel,makePrefixEndKey} from 'typestore-plugin-pouchdb'

//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Repo} from './Repo'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'

import {RegisterModel} from '../Registry'
import { isNumber, isObjectType, isObject } from "shared/util"


export type TIssueState = "open" | "closed"


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
	keyMapper: makeIssueId
})
export class Issue extends DefaultModel {

	static makeIssuePrefix = makeIssuePrefix
	
	static makeIssueId = makeIssueId
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Issue(o)

	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	repoId:number

	/**
	 * Globally unique url to view the issue
	 */
	@AttributeDescriptor()
	url: string;


	/**
	 * Associated repo
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	repo:Repo


	/**
	 * Milestones
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	milestones:Milestone[]

	/**
	 * Collaborators
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	collaborators:User[]

	/**
	 * State open/closed
	 */
	@AttributeDescriptor()
	state: TIssueState;

	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	
	@AttributeDescriptor()
	number: number;
	
	@AttributeDescriptor()
	title: string;
	
	@AttributeDescriptor()
	body: string;
	
	@AttributeDescriptor()
	user: User;
	
	@AttributeDescriptor()
	labels: Label[];
	
	@AttributeDescriptor()
	assignee: User;
	
	@AttributeDescriptor()
	milestone: Milestone;
	
	@AttributeDescriptor()
	locked: boolean;
	
	@AttributeDescriptor()
	comments: number;
	
	@AttributeDescriptor()
	pull_request: PullRequest;
	
	@AttributeDescriptor()
	closed_at: any;
	
	@AttributeDescriptor()
	created_at: Date;
	
	@AttributeDescriptor()
	updated_at: Date;
	
	@AttributeDescriptor()
	closed_by: User;


	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


/**
 * Repository for accessing repos
 */
export class IssueStore extends TSRepo<Issue> {
	constructor() {
		super(IssueStore,Issue)
	}


	
	/**
	 * Find all issues in provided repo id
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Issue[]>}
	 */
	@PouchDBPrefixFinder({
		keyProvider: (repoId:number) => {
			const
				startKey = makeIssuePrefix(repoId)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByIssuePrefix(request:FinderRequest,repoId:number):Promise<Issue[]> {
		return null
	}
	
	/**
	 * Find all issues in provided repo id
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Issue[]>}
	 */
	@PouchDBPrefixFinder({
		includeDocs: false,
		keyProvider: (repoId:number) => {
			const
				startKey = makeIssuePrefix(repoId)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findIdsByIssuePrefix(request:FinderRequest,repoId:number):Promise<string[]> {
		return null
	}
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
