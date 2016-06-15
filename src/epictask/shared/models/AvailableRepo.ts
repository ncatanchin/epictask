import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import * as uuid from 'node-uuid'
import * as _ from 'lodash'

import {Label} from './Label'
import {Milestone} from './Milestone'
import {User} from './User'
import {Repo} from './Repo'
import {Repos} from 'shared/DB'




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


	async getRepo() {
		if (this.repo)
			return this.repo

		const repoRepo = Repos.repo
		const repo = await repoRepo.get(repoRepo.key(this.repoId))

		if (!repo) {
			throw new Error('Integrated repo must have a valid repo')
		}

		this.repo = repo
		return repo
	}
}


/**
 * Repository for accessing repos
 */
export class AvailableRepoRepo extends TSRepo<AvailableRepo> {
	constructor() {
		super(AvailableRepoRepo,AvailableRepo)
	}

	@IndexedDBFinderDescriptor({
		async fn(tsRepo,...args) {
			const allJson = await tsRepo.table.toArray()

			// Finally map the results
			const repoRepo = Repos.repo
			return allJson
				.filter(async (json) => {

					const repo = await repoRepo.get(repoRepo.key(json.repoId))

					return _.lowerCase(repo.name).includes(_.lowerCase(args[0]))
				})

		}
	})
	@FinderDescriptor()
	findByName(name:string):Promise<AvailableRepo[]> {
		return null
	}


	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			return tsRepo.table.toArray()
		}
	})
	@FinderDescriptor()
	findAll():Promise<AvailableRepo[]> {
		return null
	}

}