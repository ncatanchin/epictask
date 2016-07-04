

import {
	AttributeDescriptor,
	ModelDescriptor,
	Repo as TSRepo,
	DefaultModel,
	FinderDescriptor
} from 'typestore'
//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'

export enum ActivityType {
	RepoSync = 1
}

@ModelDescriptor()
export class Activity extends DefaultModel {



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

}