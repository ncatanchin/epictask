import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder,PouchDBFullTextFinder} from 'typestore-plugin-pouchdb'

import {Label,LabelStore} from './Label'
import {Milestone,MilestoneStore} from './Milestone'
import {User,UserStore} from './User'
import {Repo,RepoStore} from './Repo'
import {RegisterModel} from '../Registry'
import {Container} from 'typescript-ioc'
import {Stores} from 'main/services/DBService'

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
	id:string

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
		single: true,
		indexFields: ['repoId'],
		selector: (repoId) => ({repoId})
	})
	findByRepoId(repoId:number):Promise<AvailableRepo> {
		return null
	}

	@PouchDBMangoFinder({all:true})
	findAll():Promise<AvailableRepo[]> {
		return null
	}

	/**
	 * Completely load an `AvailableRepo`
	 * with all dependencies - this is for editing only
	 * mostly convience
	 *
	 * @param repoId
	 * @returns {({}&AvailableRepo)|any|*}
	 */
	async load(repoId:number):Promise<AvailableRepo> {
		const stores = Container.get(Stores)

		const availRepo = await stores.availableRepo.findByRepoId(repoId)
		assert(availRepo,`No avail repo found for repo id ${repoId}`)

		const filled = Object.assign({},availRepo)

		if (!filled.repo) {
			filled.repo = await stores.repo.get(repoId)
			if (!filled.repo)
				filled.repo= await stores.repo.get(`${repoId}`)
		}

		if (!filled.labels) {
			filled.labels = _.nilFilter(await stores.label.findByRepoId(filled.repoId))
		}

		if (!filled.milestones) {
			filled.milestones = _.nilFilter(await stores.milestone.findByRepoId(filled.repoId))

		}

		// if (!availRepo.collaborators) {
		// 	filled.collaborators = await userRepo.findByRepoId(filled.repoId)
		// }
		return filled
	}

	async loadAll():Promise<AvailableRepo[]> {
		const all = await this.findAll()



		const promises = all.map(availRepo => this.load(availRepo.repoId))

		return await Promise.all(promises)

	}



}