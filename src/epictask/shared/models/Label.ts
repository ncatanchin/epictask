import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'
import * as uuid from 'node-uuid'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {LunrIndex} from '../LunrIndex'

/**
 * Create label index
 *
 * @type {LunrIndex}
 */
export const LabelIndex = new LunrIndex<Label>('Label', {
	ref: 'id',
	fields: {
		name: 3
	}
})


@ModelDescriptor({onPersistenceEvent:LabelIndex.onPersistenceEvent})
export class Label extends DefaultModel {

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
	@IndexedDBFinderDescriptor({
		fn: (tsRepo,...args) => tsRepo.table.where('repoId').anyOf(args).sortBy('name')
	})
	@FinderDescriptor()
	findByRepoId(...repoIds:number[]):Promise<Label[]> {
		return null
	}

	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			return tsRepo.table.toArray()
		}
	})
	@FinderDescriptor()
	findAll():Promise<Label[]> {
		return null
	}

}