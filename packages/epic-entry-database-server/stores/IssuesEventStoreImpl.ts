import {
	
	FinderRequest
} from 'typestore'

import {
	PouchDBRepo,
	PouchDBPrefixFinder,
	makePrefixEndKey
} from 'typestore-plugin-pouchdb'
import { IssuesEventStore, IssuesEvent, makeIssuesEventPrefix, Issue } from "epic-models"
import { isNumber } from  "epic-global"


/**
 * Issue Events Store
 */
export class IssuesEventStoreImpl extends PouchDBRepo<IssuesEvent> implements IssuesEventStore {
	
	constructor() {
		super(IssuesEventStoreImpl,IssuesEvent)
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

