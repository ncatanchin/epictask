// IMPORTS
import {ActionFactory, ActionMessage, ActionReducer} from 'typedux'
import {List, Map} from 'immutable'
import {JobState, IJobStatusDetail, TJobLogLevel, JobLogLevel} from "shared/actions/jobs/JobState"
import {IJob, JobType, JobStatus} from 'shared/actions/jobs/JobTypes'
import {JobKey} from "shared/Constants"
import * as uuid from 'node-uuid'
import {cloneObject} from "shared/util/ObjectUtil"

const log = getLogger(__filename)

/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

export class JobActionFactory extends ActionFactory<JobState,ActionMessage<JobState>> {
	
	constructor() {
		super(JobState)
	}
	
	leaf(): string {
		return JobKey;
	}
	
	@ActionReducer()
	setDetail(detail: IJobStatusDetail) {
		return (jobState: JobState) => jobState.update('details', (details: List<IJobStatusDetail>) => {
			if (!details || !details.push)
				details = List<IJobStatusDetail>()
			
			details = details.filter(it => it.id !== detail.id).toList()
			return details.push(detail)
		})
	}
	
	
	/**
	 * Cancel a job
	 *
	 * @param jobId
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	@ActionReducer()
	cancel(jobId: string) {
		return (jobState: JobState) => jobState.update('all', (all: Map<string,IJob>) => {
			const job = all.valueSeq().find(it => it.id === jobId)
			if (job) {
				job.status = JobStatus.PendingCancel
				all = all.set(job.id, job)
			}
			
			return all
		})
	}
	
	
	/**
	 * Update existing job in state, if it does not
	 * exist then the provided job will be inserted
	 *
	 * @param job
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	@ActionReducer()
	update(job: IJob) {
		return (jobState: JobState) => jobState.update('all', (all: Map<string,IJob>) => {
			const existingJob = all.valueSeq().find(it => it.id === job.id)
			if (existingJob) {
				all = all.set(job.id, cloneObject(existingJob, job))
			} else {
				all = all.set(job.id, cloneObject(job))
			}
			
			return all
		})
	}
	
	/**
	 * Create a new job
	 *
	 * @param type
	 * @param description
	 * @param args
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	@ActionReducer()
	create(type: JobType,
	       description: string = JobType[type],
	       args: any = {}) {
		
		// Create new job and details
		return (jobState: JobState) => jobState.update('all', (all: Map<string,IJob>) => {
			
			// Create Job
			const job:IJob = {
				id: uuid.v4(),
				type,
				status: JobStatus.Created,
				name: JobType[type],
				description
			}
			
			// Create details
			const detail = assign(_.pick('id','status','type'), {
				progress: 0,
				logs: []
			})
			
			return jobState
				.update('all',(all:Map<string,IJob>) => all.set(job.id,job))
				.update('details',(details:List<IJobStatusDetail>) => details.push(detail))
		})
	}
	
	@ActionReducer()
	log(jobId:string,level:JobLogLevel,message:string,error:Error = null,...details:any[]) {
		return (jobState: JobState) => jobState.update('details', (details: List<IJobStatusDetail>) => {
			const detailIndex = details.findIndex(detail => detail.id === jobId)
			
			if (detailIndex === -1) {
				log.warn(`Unable to add log to job ${jobId} - not in detail list`)
			} else {
				details = details.update(detailIndex,(detail) => {
					// Update the detail object ref and add the log
					return assign({},detail,{
						logs:[...(detail.logs || []), {
							level: JobLogLevel[level] as TJobLogLevel,
							message,
							error,
							details
						}]
					})
				})
			}
			
			return details
		})
	}
}

export default JobActionFactory