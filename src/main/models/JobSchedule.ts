import {RegisterModel} from 'shared/Registry'
/**
 * Keeps track of job scheduling
 */
@RegisterModel
export class JobSchedule {

	static fromJS = (o) => new JobSchedule(o)

	constructor(o:any = {}) {
		Object.assign(this,o)
	}

	// Actual scheduling data
	scheduler:Later.IScheduleData

	// Cancel a job
	timer?:Later.ITimer
	
	
}

