import {
	DefaultModel,
	Attribute,
	Repo as TSRepo
} from 'typestore'

import {PouchDBModel} from 'typestore-plugin-pouchdb'
import {User} from './User'
import {RegisterModel} from 'epic-global'




export function makeMilestoneId(milestone:Milestone) {
	return `${milestone.repoId}-${milestone.id}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeMilestoneId,
	onlyMapDefinedAttributes: true
})
export class Milestone extends DefaultModel {

	static makeId = makeMilestoneId
	
	static EmptyMilestone = new Milestone({
		id: -1,
		repoId: 0,
		title: "No Milestone",
		description: "No Milestone"
	})
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof Milestone ? o : new Milestone(o)


	@Attribute({primaryKey:true})
	id: number

	@Attribute()
	repoId:number
	
	@Attribute()
	url: string
	
	
	html_url: string
	
	@Attribute()
	labels_url: string
	
	@Attribute()
	number: number

	@Attribute()
	state: string
	
	@Attribute()
	title: string
	
	@Attribute()
	description: string
	
	@Attribute()
	creator: User
	
	@Attribute()
	open_issues: number
	
	@Attribute()
	closed_issues: number
	
	@Attribute()
	created_at: Date
	
	@Attribute()
	updated_at: Date
	
	@Attribute()
	closed_at: Date
	
	@Attribute()
	due_on: Date

	constructor(props:any = {}) {
		super()
		Object.assign(this,props,{
			user: User.fromJS(props.creator)
		})
	}
}


export interface MilestoneStore extends TSRepo<Milestone> {
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	findByRepo(repoId:number):Promise<Milestone[]>
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	findIdsByRepo(repoId:number):Promise<string[]>

}


