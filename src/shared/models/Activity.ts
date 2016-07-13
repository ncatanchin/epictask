

import {
	AttributeDescriptor,
	ModelDescriptor,
	Repo as TSRepo,
	DefaultModel
} from 'typestore'
import {RegisterModel} from 'shared/Registry'

import {PouchDBMangoFinder} from 'typestore-plugin-pouchdb'


export enum ActivityType {
	RepoSync = 1
}

@RegisterModel
@ModelDescriptor()
export class Activity extends DefaultModel {

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Activity(o)

	@AttributeDescriptor({primaryKey:true})
	id:string

	@AttributeDescriptor()
	type:ActivityType

	@AttributeDescriptor()
	timestamp:number

	@AttributeDescriptor()
	objectId:string

	message:string

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}


}


export class ActivityStore extends TSRepo<Activity> {
	constructor() {
		super(ActivityStore, Activity)
	}

	@PouchDBMangoFinder({
		indexFields: ['objectId'],
		includeDocs:true,
		selector: (objectId:any) => ({objectId:`${objectId}`})
	})
	findByObjectId(objectId:any):Promise<Activity[]> {
		return null
	}

}

