
import {List,Record} from 'immutable'
import {RegisterModel} from 'shared/Registry'
import {JobStatus, IJob} from "shared/actions/jobs/JobTypes"




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
export class JobStatusDetail {

	static fromJS(o:any) {
		return new JobStatusDetail(o)
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


export const JobStateRecord = Record({
	jobsInfo:List<JobStatusDetail>(),
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
		if (o && o instanceof JobState)
			return o
		
		return new JobState(Object.assign({},o,{
			jobs: List(o.jobs),
			pendingJobs: List(o.pendingJobs)
		}))
	}

	$$clazz = 'JobState'

	pending:List<IJob>
	details:List<JobStatusDetail>
	error:Error


}

