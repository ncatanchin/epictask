import {
	Repo as TSRepo,
	FinderRequest
} from 'typestore'


import {
	PouchDBPrefixFinder,
	makePrefixEndKey
} from 'typestore-plugin-pouchdb'
import { RepoEvent, RepoEventStore, Repo, makeRepoEventPrefix } from "epic-models"
import { isNumber } from  "epic-global"


export class RepoEventStoreImpl extends TSRepo<RepoEvent<any>> implements RepoEventStore{
	
	constructor() {
		super(RepoEventStoreImpl,RepoEvent)
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
