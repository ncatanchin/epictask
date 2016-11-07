import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {Label} from './Label'
import {Milestone} from './Milestone'
import {User} from './User'
import {Repo} from './Repo'

import {RegisterModel} from 'epic-global'
import { Transient } from  "epic-global"


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

assignGlobal({
	LoadStatus
})

/**
 * Maps repos that have been configured for tasks
 * to real repos
 *
 */
@RegisterModel
@Model()
export class AvailableRepo extends DefaultModel implements IAvailableRepo {

	$$clazz = 'AvailableRepo'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof AvailableRepo ? o : new AvailableRepo(o)
	
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
	@Transient
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
export interface AvailableRepoStore extends TSRepo<AvailableRepo> {
	
	findByName(name:string):Promise<AvailableRepo[]>
	
	findByRepoId(...repoIds:number[]):Promise<AvailableRepo[]>
	
	findAll():Promise<AvailableRepo[]>

}
