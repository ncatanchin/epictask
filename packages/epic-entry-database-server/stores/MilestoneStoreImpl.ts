
import {PouchDBRepo,PouchDBPrefixFinder,makePrefixEndKey} from 'typestore-plugin-pouchdb'
import { Milestone, MilestoneStore } from "epic-models"

export class MilestoneStoreImpl extends PouchDBRepo<Milestone> implements MilestoneStore {
	constructor() {
		super(MilestoneStoreImpl,Milestone)
	}
	
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		includeDocs: true,
		keyProvider: (repoId:number) => {
			const
				startKey = `${repoId}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByRepo(repoId:number):Promise<Milestone[]> {
		return null
	}
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		includeDocs: false,
		keyProvider: (repoId) => {
			const
				startKey = `${repoId}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findIdsByRepo(repoId:number):Promise<string[]> {
		return null
	}
	
}
