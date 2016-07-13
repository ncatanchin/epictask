
import * as uuid from 'node-uuid'
import {List,Record} from 'immutable'
import {RegisterModel} from '../../Registry'
import {JobHandler} from './JobHandler'


export enum JobStatus {
	Unknown = 1,
	Waiting,
	Created,
	InProgress,
	Completed,
	Failed
}

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

/**
 * Base class for all jobs to implement
 */
export abstract class Job implements IJob {

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


@RegisterModel
export class JobLog {

	static fromJS(o:any) {
		return new JobLog(o)
	}

	message:string
	details:string
	error:Error


	constructor(o:any = {}) {
		Object.assign(this,o)
	}
}

/**
 * A formally scheduled job
 */
@RegisterModel
export class JobInfo {

	static fromJS(o:any) {
		return new JobInfo(o)
	}

	constructor(o:any = {}) {
		Object.assign(this,o,{
			logs: List<JobLog>(o.logs)
		})

	}

	/**
	 * Push a new log message
	 *
	 * @param message
	 * @param details
	 * @param error
	 */
	log(message:string,details:string = null, error:Error = null) {
		this.logs = this.logs.push(new JobLog({message,details,error}))
	}

	// Use for scheduling requests, one-time is not set
	id:string

	jobId:string

	progress:number

	status:JobStatus

	error:Error

	logs: List<JobLog>

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
	nextScheduledTime:Date

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

