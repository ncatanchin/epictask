import {
	FinderRequest,
	Repo as TSRepo
} from 'typestore'
import { PouchDBPrefixFinder, makePrefixEndKey } from 'typestore-plugin-pouchdb'
import { CommentStore, Comment,Repo, Issue, makeCommentIdPrefix } from "epic-models"
import { isNumber } from  "epic-global"

export class CommentStoreImpl extends TSRepo<Comment> implements CommentStore {
	
	constructor() {
		super(CommentStoreImpl,Comment)
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
	findIdsByRepoId(repoId:number):Promise<string[]> {
		return null
	}
	
	
}
