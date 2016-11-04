import {
	Repo as PouchDBRepo
} from 'typestore'

import {PouchDBMangoFinder,PouchDBFullTextFinder} from 'typestore-plugin-pouchdb'
import { AvailableRepo } from "epic-models"
import { AvailableRepoStore } from "epic-models/AvailableRepo"


/**
 * Repository for accessing repos
 */
export class AvailableRepoStoreImpl extends PouchDBRepo<AvailableRepo> implements AvailableRepoStore {
	constructor() {
		super(AvailableRepoStoreImpl,AvailableRepo)
	}
	
	@PouchDBFullTextFinder({
		textFields: ['name']
	})
	findByName(name:string):Promise<AvailableRepo[]> {
		return null
	}
	
	@PouchDBMangoFinder({
		includeDocs: true,
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<AvailableRepo[]> {
		return null
	}
	
	// @PouchDBMangoFinder({
	// 	single: true,
	// 	indexFields: ['repoId'],
	// 	selector: (repoId) => ({repoId})
	// })
	// findByRepoId(repoId:number):Promise<AvailableRepo> {
	// 	return null
	// }
	
	@PouchDBMangoFinder({all:true})
	findAll():Promise<AvailableRepo[]> {
		return null
	}
	
}
