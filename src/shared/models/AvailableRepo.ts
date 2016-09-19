import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder,PouchDBFullTextFinder} from 'typestore-plugin-pouchdb'

import {Label} from './Label'
import {Milestone} from './Milestone'
import {User} from './User'
import {Repo} from './Repo'
import {RegisterModel} from '../Registry'


const log = getLogger(__filename)

/**
 * Maps repos that have been configured for tasks
 * to real repos
 *
 */
@RegisterModel
@ModelDescriptor({transientAttrs: ['repo']})
export class AvailableRepo extends DefaultModel {

	$$clazz = 'AvailableRepo'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new AvailableRepo(o)

	@AttributeDescriptor({primaryKey:true})
	id:number

	@AttributeDescriptor({index:{unique:true,name:'repoId'}})
	repoId:number

	@AttributeDescriptor()
	enabled:boolean

	@AttributeDescriptor()
	deleted:boolean

	@AttributeDescriptor({transient:true})
	repo:Repo

	@AttributeDescriptor({transient:true})
	labels:Label[]

	@AttributeDescriptor({transient:true})
	milestones:Milestone[]

	@AttributeDescriptor({transient:true})
	collaborators:User[]

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
