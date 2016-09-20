import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	FinderRequest,
	Repo as TSRepo
} from 'typestore'
import {PouchDBMangoFinder,PouchDBModel,PouchDBPrefixFinder,makePrefixEndKey} from 'typestore-plugin-pouchdb'

import {User} from './User'
import {Issue} from './Issue'
import {RegisterModel} from '../Registry'
import { Repo } from "shared/models"
import { isNumber, isObject, isObjectType } from "shared/util/ObjectUtil"

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

	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	repoId:number

	@AttributeDescriptor()
	issueNumber:number
	
	@AttributeDescriptor()
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

export class CommentStore extends TSRepo<Comment> {

	constructor() {
		super(CommentStore,Comment)
	}
	
	
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
	
	
	@PouchDBPrefixFinder({
		keyProvider: (repoOrRepoId:number|Repo,issueOrIssueNumber:number|Issue) => {
			const
				startKey = makeCommentIdPrefix(repoOrRepoId as any,issueOrIssueNumber as any)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByCommentPrefix(request:FinderRequest,repoOrRepoId:number|Repo,issueOrIssueNumber:number|Issue):Promise<Comment[]> {
		return null
	}
	
	/**
	 * Find all comments for a repo
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		keyProvider: (repoIdOrRepo:number|Repo) => {
			const
				startKey = `${isNumber(repoIdOrRepo) ? repoIdOrRepo : repoIdOrRepo.id}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByRepoId(request:FinderRequest,repoId:number):Promise<Comment[]> {
		return null
	}
	
	/**
	 * Find all comments for a repo
	 *
	 * @param request
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		keyProvider: (repoIdOrRepo:number|Repo) => {
			const
				startKey = `${isNumber(repoIdOrRepo) ? repoIdOrRepo : repoIdOrRepo.id}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findIdsByRepoId(request:FinderRequest,repoId:number):Promise<string[]> {
		return null
	}

	
}
