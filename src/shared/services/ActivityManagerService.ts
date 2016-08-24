
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


@RegisterService(ProcessType.Server)
export default class ActivityManagerService extends BaseService {


	private _repos:Stores
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	

	async init():Promise<this> {
		this._repos = Container.get(Stores)
		
		return super.init()
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
		return this._repos.activity.bulkRemove(...activities.map(activity => activity.id))
	}

	findByObjectId(objectId:any):Promise<Activity[]> {
		return this._repos.activity.findByObjectId(objectId)
	}

	async findLastActivity(type:ActivityType,objectId:any) {
		const activityRepo = this._repos.activity
		const refId = makeRefId(type,objectId)
		return await activityRepo.get(refId)
	}

	async createActivity(type: ActivityType,objectId:number) {
		const activityRepo = this._repos.activity
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
