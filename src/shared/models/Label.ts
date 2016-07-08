import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {RegisterModel} from 'shared/Registry'



@RegisterModel
@ModelDescriptor()
export class Label extends DefaultModel {

	$$clazz = 'Label'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Label(o)

	@AttributeDescriptor({primaryKey:true})
	url: string

	@AttributeDescriptor({index:{name:'repoId'}})
	repoId:number

	@AttributeDescriptor({index:{name:'labelName'}})
	name: string;

	@AttributeDescriptor()
	color: string;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

export class LabelStore extends TSRepo<Label> {
	constructor() {
		super(LabelStore,Label)
	}

	/**
	 * Find all labels in provided repo ids
	 * @param repoIds
	 * @returns {Label[]}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				$eq: repoId
			}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Label[]> {
		return null
	}



}
