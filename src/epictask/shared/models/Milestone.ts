import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {LunrIndex} from '../LunrIndex'

/**
 * Create milestone index
 *
 * @type {LunrIndex}
 */
export const MilestoneIndex = new LunrIndex<Milestone>('Milestone', {
	ref: 'id',
	fields: {
		title: 3
	}
})


@ModelDescriptor({
	onPersistenceEvent:MilestoneIndex.onPersistenceEvent
})
export class Milestone extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number

	@AttributeDescriptor()
	repoId:number

	url: string
	html_url: string
	labels_url: string


	number: number
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


export class MilestoneRepo extends TSRepo<Milestone> {
	constructor() {
		super(MilestoneRepo,Milestone)
	}

	/**
	 * Find all issues in provided repo ids
	 * @param repoIds
	 * @returns {Promise<Milestone[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				$eq: repoId
			}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Milestone[]> {
		return null
	}

}
