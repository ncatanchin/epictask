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
import {RegisterModel} from './Registry'

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

	async load(availRepo:AvailableRepo):Promise<AvailableRepo> {
		const
			repoRepo = this.coordinator.getRepo(RepoStore),
			labelRepo = this.coordinator.getRepo(LabelStore),
			milestoneRepo = this.coordinator.getRepo(MilestoneStore),
			userRepo = this.coordinator.getRepo(UserStore)

		const filled = Object.assign({},availRepo)

		if (!filled.repo) {
			filled.repo = await repoRepo.get(filled.repoId)
		}

		if (!filled.labels) {
			filled.labels = await labelRepo.findByRepoId(filled.repoId)
		}

		if (!availRepo.milestones) {
			filled.milestones = await milestoneRepo.findByRepoId(filled.repoId)
		}

		// if (!availRepo.collaborators) {
		// 	filled.collaborators = await userRepo.findByRepoId(filled.repoId)
		// }
		return filled
	}

	async loadAll():Promise<AvailableRepo[]> {
		const all = await this.findAll()



		const promises = all.map(availRepo => this.load(availRepo))

		return await Promise.all(promises)

	}



}
