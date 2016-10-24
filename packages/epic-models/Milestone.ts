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
	keyMapper: makeMilestoneId
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
	static fromJS = (o:any) => new Milestone(o)


	@Attribute({primaryKey:true})
	id: number

	@Attribute()
	repoId:number

	url: string
	html_url: string
	labels_url: string


	number: number

	@Attribute()
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


