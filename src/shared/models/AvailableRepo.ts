import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder,PouchDBFullTextFinder} from 'typestore-plugin-pouchdb'

import {Label} from './Label'
import {Milestone} from './Milestone'
import {User} from './User'
import {Repo} from './Repo'
import {RegisterModel} from '../Registry'
import { Transient } from "shared/util/Decorations"


const
	log = getLogger(__filename)


/**
 * Current status of repo's data loading
 */
export enum LoadStatus {
	NotLoaded = 1,
	Loading,
	Loaded
}

/**
 * Maps repos that have been configured for tasks
 * to real repos
 *
 */
@RegisterModel
@Model()
export class AvailableRepo extends DefaultModel {

	$$clazz = 'AvailableRepo'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new AvailableRepo(o)
	
	/**
	 * id, equals repoId, equals repo.id
	 */
	@Attribute({primaryKey:true})
	id:number
	
	/**
	 * Repo id ref
	 */
	@Attribute({index:{unique:true,name:'repoId'}})
	repoId:number
	
	/**
	 * Enabled or not enabled
	 */
	@Attribute()
	enabled:boolean
	
	/**
	 * Is this repo deleted
	 */
	@Attribute()
	deleted:boolean
	
	/**
	 * Repo reference
	 */
	@Transient
	repo:Repo
	
	/**
	 * All current labels
	 */
	@Transient
	labels:Label[]
	
	/**
	 * All current milestones
	 */
	@Transient
	milestones:Milestone[]
	
	/**
	 * All available assignees/collaborators
	 */
	@Transient
	collaborators:User[]
	
	/**
	 * Current load status of the repo
	 */
	@Transient
	repoLoadStatus:LoadStatus
	
	/**
	 * Current load status of issues for this repo
	 */
	@Transient
	issuesLoadStatus:LoadStatus
	
	constructor(props = {}) {
		super()

		Object.assign(this,props)
	}
}


/**
 * Repository for accessing repos
 */
export class AvailableRepoStore extends TSRepo<AvailableRepo> {
	constructor() {
		super(AvailableRepoStore,AvailableRepo)
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
