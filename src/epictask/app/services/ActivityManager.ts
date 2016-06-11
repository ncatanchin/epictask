import * as uuid from 'node-uuid'
import {Repos} from 'shared/DB'
import {
	Activity,
	ActivityType
} from 'shared'

const log = getLogger(__filename)

function makeRefId(type:ActivityType,objectId:any) {
	return `${ActivityType[type]}-${objectId}`
}

export async function findLastActivity(type:ActivityType,objectId:any) {
	const activityRepo = Repos.activity
	const refId = makeRefId(type,objectId)
	const activities = await activityRepo.findNewestByRefId(refId)
	return (activities && activities.length) ? activities[0] : null
}

export async function createActivity(type: ActivityType,objectId:number) {
	const activityRepo = Repos.activity
	const activity = new Activity({
		id: makeRefId(type,objectId),
		type: type,
		timestamp: Date.now(),
		objectId: '' + objectId
	})

	return await activityRepo.save(activity)
}


export async function start() {
	log.info('Started activity manager')
}