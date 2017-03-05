import {FinderRequest,FinderResultArray} from 'typestore'
import {PouchDBRepo,PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import { Repo, RepoStore } from "epic-models"

export class RepoStoreImpl extends PouchDBRepo<Repo> implements RepoStore {
	
	constructor() {
		super(RepoStoreImpl,Repo)
	}
	
	@PouchDBFullTextFinder({
		includeDocs: true,
		textFields: ['name','full_name','description']
	})
	findWithText(request:FinderRequest, name:string):Promise<FinderResultArray<Repo>> {
		return null
	}
	
	@PouchDBMangoFinder({
		single: true,
		includeDocs: false,
		indexFields: ['full_name'],
		selector: (full_name) => ({full_name})
	})
	findByFullName(fullName:string):Promise<number> {
		return null
	}
	
	/**
	 * Find all repos
	 * @returns {Promise<Repo[]>}
	 */
	@PouchDBMangoFinder({all:true})
	findAll():Promise<FinderResultArray<Repo>> {
		return null
	}
}

