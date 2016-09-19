import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	
	Repo as TSRepo
} from 'typestore'

import {PouchDBModel,PouchDBPrefixFinder,makePrefixEndKey,PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {User} from './User'
import {RegisterModel} from '../Registry'
import { Repo } from "shared/models"
import { isNumber } from "shared/util"


export function makeMilestoneId(milestone:Milestone) {
	return `${milestone.repoId}-${milestone.id}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeMilestoneId
})
export class Milestone extends DefaultModel {

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Milestone(o)


	@AttributeDescriptor({primaryKey:true})
	id: number

	@AttributeDescriptor()
	repoId:number

	url: string
	html_url: string
	labels_url: string


	number: number

	@AttributeDescriptor()
	state: string
	title: string
	description: string
	creator: User
	open_issues: number
	closed_issues: number
	created_at: Date
	updated_at: Date
	closed_at: Date
	due_on: Date

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


export class MilestoneStore extends TSRepo<Milestone> {
	constructor() {
		super(MilestoneStore,Milestone)
	}

	
	/**
	 * Find all milestone ids for a repo
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
	findByRepo(repoId:number|Repo):Promise<Milestone[]> {
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
		keyProvider: (repoIdOrRepo:number|Repo) => {
			const
				startKey = `${isNumber(repoIdOrRepo) ? repoIdOrRepo : repoIdOrRepo.id}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findIdsByRepo(repoId:number|Repo):Promise<string[]> {
		return null
	}

}


