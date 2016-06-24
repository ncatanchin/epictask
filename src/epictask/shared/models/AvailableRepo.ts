import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder,PouchDBFullTextFinder} from 'typestore-plugin-pouchdb'
//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import * as uuid from 'node-uuid'
import * as _ from 'lodash'

import {Label,LabelRepo} from './Label'
import {Milestone,MilestoneRepo} from './Milestone'
import {User,UserRepo} from './User'
import {Repo,RepoRepo} from './Repo'
import {cloneObject} from '../util/ObjectUtil'


/**
 * Maps repos that have been configured for tasks
 * to real repos
 *
 */
@ModelDescriptor({transientAttrs: ['repo']})
export class AvailableRepo extends DefaultModel {

	@DefaultValue(() => uuid.v4())
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
export class AvailableRepoRepo extends TSRepo<AvailableRepo> {
	constructor() {
		super(AvailableRepoRepo,AvailableRepo)
	}

	@PouchDBFullTextFinder({
		textFields: ['name']
	})
	findByName(name:string):Promise<AvailableRepo[]> {
		return null
	}

	@PouchDBMangoFinder({all:true})
	findAll():Promise<AvailableRepo[]> {
		return null
	}

	async load(availRepo:AvailableRepo):Promise<AvailableRepo> {
		const
			repoRepo = this.coordinator.getRepo(RepoRepo),
			labelRepo = this.coordinator.getRepo(LabelRepo),
			milestoneRepo = this.coordinator.getRepo(MilestoneRepo),
			userRepo = this.coordinator.getRepo(UserRepo)

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

		if (!availRepo.collaborators) {
			filled.collaborators = await userRepo.findByRepoId(filled.repoId)
		}
		return cloneObject(filled)
	}

	async loadAll():Promise<AvailableRepo[]> {
		const all = await this.findAll()



		const promises = all.map(availRepo => this.load(availRepo))

		return await Promise.all(promises)

	}



}