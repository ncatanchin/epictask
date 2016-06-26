import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {LunrIndex} from '../LunrIndex'
import {registerModel} from './Registry'


export const LabelClassName = 'Label'

@ModelDescriptor()
export class Label extends DefaultModel {

	$$clazz = LabelClassName

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

export class LabelRepo extends TSRepo<Label> {
	constructor() {
		super(LabelRepo,Label)
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

registerModel(LabelClassName,Label)