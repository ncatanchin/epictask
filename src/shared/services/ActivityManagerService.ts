
import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import {Stores, DatabaseClientService} from './DatabaseClientService'
import {
	Activity,
	ActivityType
} from 'shared/models/Activity'
import {ProcessType} from "shared/ProcessType"



const log = getLogger(__filename)


function makeRefId(type:ActivityType,objectId:any) {
	return `${ActivityType[type]}-${objectId}`
}

/**
 * Get stores
 *
 * @returns {any}
 */
function getStores() {
	return Container.get(Stores)
}

@RegisterService(ProcessType.UI)
export default class ActivityManagerService extends BaseService {

	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	

	async start():Promise<this> {
		return super.start()
	}


	async stop():Promise<this> {
		return super.stop()
	}

	destroy():this {
		return super.destroy()
	}

	async removeByObjectId(objectId:any) {
		const activities = await this.findByObjectId(objectId)
		return getStores().activity.bulkRemove(...activities.map(activity => activity.id))
	}

	findByObjectId(objectId:any):Promise<Activity[]> {
		return getStores().activity.findByObjectId(objectId)
	}

	async findLastActivity(type:ActivityType,objectId:any) {
		const activityRepo = getStores().activity
		const refId = makeRefId(type,objectId)
		return await activityRepo.get(refId)
	}

	async createActivity(type: ActivityType,objectId:number) {
		const activityRepo = getStores().activity
		let activity = new Activity({
			id: makeRefId(type,objectId),
			type: type,
			timestamp: Date.now(),
			objectId: '' + objectId
		})

		const existingActivity = await activityRepo.get(activity.id)

		if (existingActivity)
			activity = _.assign({},existingActivity,activity) as Activity

		return await activityRepo.save(activity)
	}

}

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}