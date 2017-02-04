import {
	Model,
	Attribute,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBModel} from 'typestore-plugin-pouchdb'
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



@Scopes.Models.Register
@PouchDBModel({
	keyMapper: makeLabelId,
	onlyMapDefinedAttributes: true
})
export class Label extends DefaultModel implements ILabel {

	static makeId = makeLabelId
	
	static isLabel(o:any):o is Label {
		return o && ((o.color && o.name) || o.$$clazz === Label.$$clazz)
	}
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof Label ? o : new Label(o)
	
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


/**
 * Guard for label
 *
 * @param o
 * @returns {any|boolean}
 */
export const isLabel = Label.isLabel

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


