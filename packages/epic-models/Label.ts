import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBModel} from 'typestore-plugin-pouchdb'
import {RegisterModel} from 'epic-global'
import { Repo } from "./Repo"

/**
 * Label ids
 *
 * @param label
 * @returns {string}
 */
export function makeLabelId(label:Label) {
	return `${label.repoId}-${label.id}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeLabelId
})
export class Label extends DefaultModel {

	static makeId = makeLabelId
	
	static isLabel(o:any):o is Label {
		return o.url && o.name && !o.id
	}

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Label(o)
	
	@Attribute({primaryKey:true})
	id:number
	
	@Attribute()
	url: string

	@Attribute()
	repoId:number

	@Attribute()
	name: string;

	@Attribute()
	color: string;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

export interface LabelStore extends TSRepo<Label> {
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	findByRepo(repoId:number|Repo):Promise<Label[]>
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	findIdsByRepo(repoId:number|Repo):Promise<string[]>


}


