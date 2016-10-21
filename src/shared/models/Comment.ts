import {
	Model,
	Attribute,
	FinderDescriptor,
	DefaultModel,
	FinderRequest,
	Repo as TSRepo
} from 'typestore'
import {PouchDBModel} from 'typestore-plugin-pouchdb'

import {User} from './User'
import {Issue} from './Issue'
import {RegisterModel} from '../Registry'
import { Repo } from "./Repo"
import { isNumber, isObject, isObjectType } from "shared/util"

export function makeCommentIdPrefix(repoId:number,issueNumber:number)
export function makeCommentIdPrefix(repo:Repo,issue:Issue)
export function makeCommentIdPrefix(repoOrRepoId:number|Repo,issueOrIssueNumber:number|Issue) {
	let repoId = -1, issueNumber = -1
	if (isNumber(repoOrRepoId) && isNumber(issueOrIssueNumber)) {
		repoId = repoOrRepoId
		issueNumber = issueOrIssueNumber
	} else if (isObjectType(repoOrRepoId,Repo) && isObjectType(issueOrIssueNumber,Issue)) {
		repoId = repoOrRepoId.id
		issueNumber = issueOrIssueNumber.number
	}
	
	assert(repoId > -1 && issueNumber > -1, `Repo id and issue id could not be determined (${repoId}-${issueNumber})`)
	return `${repoId}-${issueNumber}-`
}

export function makeCommentId(comment:Comment)
export function makeCommentId(repoId:number,issueNumber:number,commentId:number)
export function makeCommentId(repo:Repo,issue:Issue,commentId:number)
export function makeCommentId(repoOrRepoIdOrComment:number|Comment|Repo,issueOrIssueNumber:number|Issue = null,commentId:number = -1) {
	let repoId = -1, issueNumber = -1
	if (repoOrRepoIdOrComment && !isNumber(repoOrRepoIdOrComment) && (repoOrRepoIdOrComment as any).repoId) {
		({repoId,issueNumber,id:commentId} = repoOrRepoIdOrComment as Comment)
	} else if (isNumber(repoOrRepoIdOrComment) && isNumber(issueOrIssueNumber)) {
		repoId = repoOrRepoIdOrComment
		issueNumber = issueOrIssueNumber
	} else if (isObjectType(repoOrRepoIdOrComment,Repo) && isObjectType(issueOrIssueNumber,Issue)) {
		repoId = repoOrRepoIdOrComment.id
		issueNumber = issueOrIssueNumber.number
	}
	
	
	assert(repoId > -1 && issueNumber > -1 && commentId > -1,
		`Repo id and issue id could not be determined (${repoId}-${issueNumber}-${commentId})`)
	
	return `${makeCommentIdPrefix(repoId,issueNumber)}${commentId}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeCommentId
})
export class Comment extends DefaultModel {
	
	static makeCommentIdPrefix = makeCommentIdPrefix
	
	static makeCommentId = makeCommentId
	
	//static $$clazz = 'Comment'
	
	$$clazz = 'Comment'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Comment(o)

	static makeParentRefId(repoId,issueNumber) {
		return `${repoId}-${issueNumber}`
	}

	@Attribute({primaryKey:true})
	id: number;

	@Attribute()
	repoId:number

	@Attribute()
	issueNumber:number
	
	@Attribute()
	url: string
	
	html_url: string
	issue_url:string

	body: string
	user: User
	created_at: Date
	updated_at: Date

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

export interface CommentStore extends TSRepo<Comment> {

	/**
	 * Find all comments for a repo
	 *
	 * @param request
	 * @param repoId
	 * @param issueNumber
	 * @returns {Promise<Comment[]>}
	 */
	findByCommentPrefix(request:FinderRequest,repoId:number,issueNumber:number):Promise<Comment[]>
	
	/**
	 * Find all comments for a repo
	 *
	 * @param request
	 * @param repo
	 * @param issue
	 * @returns {Promise<Comment[]>}
	 */
	findByCommentPrefix(request:FinderRequest,repo:Repo,issue:Issue):Promise<Comment[]>
	
	
	
	/**
	 * Find all comments for a repo
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	
	findByRepoId(request:FinderRequest,repoId:number):Promise<Comment[]>
	
	/**
	 * Find all comments for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	findIdsByRepoId(repoId:number):Promise<string[]>
	
}

/**
 * Type guard comment
 *
 * @param o
 * @returns {any|boolean}
 */
export function isComment(o:any):o is Comment {
	return o && (o.$$clazz === Comment.$$clazz || o instanceof Comment)
}