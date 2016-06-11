

import {
	AttributeDescriptor,
	ModelDescriptor,
	Repo as TSRepo,
	DefaultModel,
	FinderDescriptor
} from 'typestore'
import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'

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

export class ActivityRepo extends TSRepo<Activity> {
	constructor() {
		super(ActivityRepo, Activity)
	}

	@IndexedDBFinderDescriptor({
		fn: async (tsRepo,...args) => {
			const [refId] = args
			const result = await tsRepo.table.get(refId)
			return (result) ? [result] : []
		}
	})
	@FinderDescriptor()
	findNewestByRefId(refId:string):Promise<Activity[]> {
		return null
	}

	@IndexedDBFinderDescriptor({
		fn: async (tsRepo,...args) => {
			const [type,objectId] = args
			const refId = `${type}-${objectId}`
			const result = await tsRepo.table.get(refId)
			return (result) ? [result] : []
		}
	})
	@FinderDescriptor()
	findNewestByTypeAndObjectId(type:ActivityType,objectId:string):Promise<Activity[]> {
		return null
	}


}