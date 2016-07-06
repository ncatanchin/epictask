import {Singleton, AutoWired,Inject} from 'typescript-ioc'

import {IService, ServiceStatus} from './IService'
//import DBService from './DBService'
import {Stores} from './DBService'
import {
	Activity,
	ActivityType
} from 'shared/models/Activity'


const log = getLogger(__filename)


function makeRefId(type:ActivityType,objectId:any) {
	return `${ActivityType[type]}-${objectId}`
}


@AutoWired
@Singleton
export default class ActivityManagerService implements IService {

	@Inject
	private _repos:Stores
	private _status:ServiceStatus

	status():ServiceStatus {
		return this._status
	}


	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		return this
	}

	async start():Promise<this> {
		this._status = ServiceStatus.Started
		return this
	}


	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped
		return this
	}

	destroy():this {
		return this
	}


	async findLastActivity(type:ActivityType,objectId:any) {
		const activityRepo = this._repos.activity
		const refId = makeRefId(type,objectId)
		return await activityRepo.get(refId)
	}

	async createActivity(type: ActivityType,objectId:number) {
		const activityRepo = this._repos.activity
		const activity = new Activity({
			id: makeRefId(type,objectId),
			type: type,
			timestamp: Date.now(),
			objectId: '' + objectId
		})

		return await activityRepo.save(activity)
	}

}
