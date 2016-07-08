// Register the state model
import * as uuid from 'node-uuid'
import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {List,Record,Map} from 'immutable'

import {JobStatus} from './JobStatus'
import {JobKey} from "shared/Constants"
import {RegisterModel} from '../../Registry'
import {JobHandler} from './JobHandler'


const log = getLogger(__filename)

/**
 * Standard job definition
 */
export interface IJob {
	id:string
	name:string
	args?:any


	status?:JobStatus
	progress?:number
	message?:string
	error?:Error
	updatedAt?:number
	immediate?:boolean
	scheduled?:boolean

	// One-at-atime execution (based on name)
	oneAtATime?:boolean

	// A schedule to use for executing this job
	// repeatedly - cron format is support
	schedule?:string

	// Should the job repeat on the schedule
	repeat?:boolean


	description?:string
}


export abstract class BaseJob implements IJob {

	id:string = uuid.v4()
	status:JobStatus = JobStatus.Created
	progress:number
	args:any
	immediate:boolean = false

	// Status message
	message:string

	// Last error that occured
	error:Error

	// Last Updated
	updatedAt:number = Date.now()

	// Status details
	description:string

	// One-at-atime execution (based on name or id)
	oneAtATime:boolean = false

	// A schedule to use for executing this job
	// repeatedly - cron format is support
	schedule:string
	scheduled:boolean = false

	// Should the job repeat on the schedule
	repeat:boolean = false

	// Name of the job - may be used for uniqueness test
	name:string



	constructor(job:IJob = null) {

		if (job)
			Object.assign(this,job)

		this.id = this.id || uuid.v4()
	}

	abstract executor(handler:JobHandler):Promise<any>
}





/**
 * A formally scheduled job
 */
@RegisterModel
export class JobInfo {

	$$clazz = 'JobInfo'

	static fromJS(o:any) {
		return new JobInfo(o)
	}

	constructor(o:any = {}) {
		Object.assign(this,o)
	}

	// Use for scheduling requests, one-time is not set
	id:string

	jobId:string

	progress:number

	status:JobStatus

	error:Error
	/**
	 * is the job running now
	 *
	 * @type {boolean}
	 */
	running:boolean = false

	/**
	 * Status description if any
	 */
	description:string

	/**
	 * Next execution time in epoch - millis from 1970
	 */
	nextExecutionTime:number

	/**
	 * The current job schedule
	 */
	schedule:string

	/**
	 * Job type/name
	 */
	type:string
}

export interface IJobInfo extends JobInfo {

}


export const JobStateRecord = Record({
	jobsInfo:List<IJobInfo>(),
	pendingJobs:List<IJob>(),
	error:null

})


/**
 * Keeps track of ongoing job
 * information status and scheduling
 */
@RegisterModel
export class JobState extends JobStateRecord {

	static fromJS(o:any) {
		return new JobState(Object.assign({},o,{
			jobs: List(o.jobs),
			pendingJobs: List(o.pendingJobs)
		}))
	}

	$$clazz = 'JobState'

	pendingJobs:List<IJob>
	jobsInfo:List<IJobInfo>
	error:Error


}




/**
 * Reducer
 *
 * Sets all values onto the state
 */
export class JobReducer extends DefaultLeafReducer<JobState,ActionMessage<JobState>> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState():any {
		return new JobState()
	}


	updateJob(state:JobState,updatedJob:IJobInfo) {
		const index = state.jobsInfo.findIndex(job => job.id === updatedJob.id)

		return state.merge({
			jobs: (index === -1) ? state.jobsInfo.push(updatedJob) :
				state.jobsInfo.set(index,updatedJob)
		})

	}


	triggerJob(state:JobState,job:IJob) {
		return state.set('pendingJobs',state.pendingJobs.push(job))
	}

	clearPendingJobs(state:JobState) {
		return state.set('pendingJobs',List())
	}


	setJobsInfo(state:JobState,jobsInfo:List<IJobInfo>) {
		return state.merge({jobsInfo})
	}

	setError(state:JobState,err:Error) {
		return state.merge({error:err})
	}
}