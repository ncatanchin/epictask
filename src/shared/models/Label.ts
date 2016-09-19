import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBModel,PouchDBPrefixFinder,makePrefixEndKey} from 'typestore-plugin-pouchdb'
import {RegisterModel} from 'shared/Registry'
import { Repo } from "shared/models"
import { isNumber } from "shared/util"

export function makeLabelId(label:Label) {
	return `${label.repoId}-${label.url}`
}

@RegisterModel
@PouchDBModel({
	keyMapper: makeLabelId
})
export class Label extends DefaultModel {

	static isLabel(o:any):o is Label {
		return o.url && o.name && !o.id
	}

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
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		keyProvider: (repoIdOrRepo:number|Repo) => {
			const
				startKey = `${isNumber(repoIdOrRepo) ? repoIdOrRepo : repoIdOrRepo.id}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findByRepo(repoId:number|Repo):Promise<Label[]> {
		return null
	}
	
	/**
	 * Find all milestone ids for a repo
	 *
	 * @param repoId
	 * @returns {Promise<Comment[]>}
	 */
	@PouchDBPrefixFinder({
		includeDocs: false,
		keyProvider: (repoIdOrRepo:number|Repo) => {
			const
				startKey = `${isNumber(repoIdOrRepo) ? repoIdOrRepo : repoIdOrRepo.id}-`
			
			return {
				startKey,
				endKey: makePrefixEndKey(startKey)
			}
		}
	})
	findIdsByRepo(repoId:number|Repo):Promise<string[]> {
		return null
	}



}


