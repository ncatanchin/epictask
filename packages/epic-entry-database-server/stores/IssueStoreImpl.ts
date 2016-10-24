import {
	Repo as TSRepo,
	FinderRequest
} from 'typestore'
import {PouchDBPrefixFinder,makePrefixEndKey} from 'typestore-plugin-pouchdb'

//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import { IssueStore, Issue, makeIssuePrefix } from "epic-models"




/**
 * Repository for accessing repos
 */
export class IssueStoreImpl extends TSRepo<Issue> implements IssueStore {
	constructor() {
		super(IssueStoreImpl,Issue)
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
	 * Same as above - just reverse order - better for
	 * loading in display
	 *
	 * @param request
	 * @param repoId
	 * @returns {null}
	 */
	@PouchDBPrefixFinder({
		reverse:true,
		keyProvider: (repoId:number) => {
			const
				startKey = makeIssuePrefix(repoId)
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByIssuePrefixReverse(request:FinderRequest,repoId:number):Promise<Issue[]> {
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
	findIdsByIssuePrefix(repoId:number):Promise<string[]> {
		return null
	}
	
}