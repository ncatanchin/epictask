import {
	
	FinderRequest
} from 'typestore'


import {
	PouchDBRepo,
	PouchDBPrefixFinder,
	makePrefixEndKey, PouchDBMangoFinder
} from 'typestore-plugin-pouchdb'
import { GithubNotification, GithubNotificationStore } from "epic-models"
import { isNumber } from  "epic-global"


export class GithubNotificationStoreImpl extends PouchDBRepo<GithubNotification> implements GithubNotificationStore{
	
	constructor() {
		super(GithubNotificationStoreImpl,GithubNotification)
	}
	
	/**
	 * Find all users who contribute to a repo
	 *
	 * @returns {null}
	 * @param reasons
	 */
	@PouchDBMangoFinder({
		indexFields: ['reason'],
		selector: (...reasons) => ({
			$or: reasons.map(reason => ({
				repoIds: {
					$elemMatch:{
						$eq: reason
					}
				}
			}))
		})
	})
	findByReason(...reasons:string[]):Promise<GithubNotification> {
		return null
	}
	
	@PouchDBMangoFinder({
		all:true,
		includeDocs:true
	})
	findAll():Promise<GithubNotification[]> {
		return null
	}
}
