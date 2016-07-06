
import {List,Record,Map} from 'immutable'

// Register the state model
import {ActionMessage} from 'typedux'

import {JobKey} from '../../Constants'
import {registerModel} from '../../models/Registry'


import {JobStatus} from './JobStatus'
import {JobHandler} from './JobHandler'


const log = getLogger(__filename)

/**
 * Standard job definition
 */
export interface IJob {
	id:string
	status:JobStatus
	progress:number
	request:IJobRequest
	handler?:JobHandler
	name?:string
	message?:string
	error?:Error
	updatedAt?:number
}

/**
 * Job executor shape
 */
export interface IJobExecutor {
	(handler:JobHandler):void
}

/**
 * Request to create an individual or
 * scheduled job
 */
export interface IJobRequest {

	// One-at-atime execution (based on name)
	oneAtATime?:boolean

	// A schedule to use for executing this job
	// repeatedly - cron format is support
	schedule?:string|Function

	// Should the job repeat on the schedule
	repeat?:boolean

	// Name for the job
	name:string

	// The actual executor
	executor:IJobExecutor
}



/**
 * A formally scheduled job
 */
export interface IScheduledJob extends IJobRequest {
	// Use for scheduling requests, one-time is not set
	id:string

	// Actual scheduling data
	scheduler:Later.IScheduleData

	// Cancel a job
	timer?:Later.ITimer
}



export const JobStateRecord = Record({
	jobs:List<IJob>(),
	error:null,
	scheduledJobs:List<IScheduledJob>()
})



export class JobState extends JobStateRecord {

	static fromJS(o:any) {
		return new JobState(Object.assign({},o,{
			jobs: List(o.jobs),
			scheduledJobs: List(o.scheduledJobs)
		}))
	}

	jobs:List<IJob>
	scheduledJobs:List<IScheduledJob>
	error:Error


}



export interface JobMessage extends ActionMessage<JobState> {

}

registerModel(JobKey,JobState)
