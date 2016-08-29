// IMPORTS
import * as uuid from 'node-uuid'
import {ActionFactory, ActionMessage, ActionReducer} from 'typedux'
import {List, Map} from 'immutable'
import {JobState, IJobStatusDetail, TJobLogLevel, JobLogLevel} from "shared/actions/jobs/JobState"
import {IJob, JobType, JobStatus, IJobSchedule} from 'shared/actions/jobs/JobTypes'
import {JobKey} from "shared/Constants"
import {Provided} from 'shared/util/Decorations'
import {cloneObject} from "shared/util/ObjectUtil"

const log = getLogger(__filename)


export type TJobIMap = Map<string,IJob>

/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@Provided
export class JobActionFactory extends ActionFactory<JobState,ActionMessage<JobState>> {
	
	constructor() {
		super(JobState)
	}
	
	leaf(): string {
		return JobKey;
	}
	
	private updateDetail = (jobState:JobState,detail:IJobStatusDetail) => jobState
		.update('details', (details: List<IJobStatusDetail>) => {
			if (!details || !details.push)
				details = List<IJobStatusDetail>()
			
			// Set the updated timestamp
			detail.updatedAt = Date.now()
			
			const
				index = details.findIndex(it => it.id === detail.id),
				existingDetail = (index > -1) && details.get(index)
			
			if (existingDetail)
				detail.logs = _.sortBy(_.uniqBy([...detail.logs,...existingDetail.logs],'id'),'timestamp')
			
			//details = details.filter(it => it.id !== detail.id).toList()
			return index === -1 ?
				details.push(detail) :
				details.set(index, detail)
		})
	
	
	/**
	 * Set job status detail
	 * @param detail
	 */
	@ActionReducer()
	setDetail(detail: IJobStatusDetail) {
		return (jobState:JobState) => this.updateDetail(jobState,detail)
	}
	
	/**
	 * Set all the current job schedules
	 *
	 * @param schedules
	 * @returns {(jobState:JobState)=>Map<string, any>}
	 */
	@ActionReducer()
	setSchedules(...schedules:IJobSchedule[]) {
		return (jobState:JobState) =>  jobState.set('schedules',
			schedules.reduce((map:Map<string,IJobSchedule>,schedule) => {
				return map.set(schedule.id,schedule)
			},Map<string,IJobSchedule>()))
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
	 * @param detail
	 */
	@ActionReducer()
	update(job: IJob, detail:IJobStatusDetail) {
		return (jobStateIM: JobState) => jobStateIM.withMutations((jobState:JobState) => {
			// Update Job first
			const allJobs:TJobIMap = jobState.all
			
			const
				existingJob = allJobs.valueSeq().find(it => it.id === job.id),
				newJob = existingJob ?
					cloneObject(existingJob, job) :
					cloneObject(job)
			
			jobState = jobState.set('all',allJobs.set(job.id, newJob)) as any
			
			return this.updateDetail(jobState,detail)
			
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
	
	create(type: JobType,
	       description: string = JobType[type],
	       args: any = {}) {
		
		
		// Create Job
		const job:IJob = {
			id: uuid.v4(),
			type,
			status: JobStatus.Created,
			name: JobType[type],
			description,
			args
		}
		
		// Create details
		const detail = assign(_.pick(job,'id','status','type'), {
			createdAt: Date.now(),
			updatedAt: Date.now(),
			progress: 0,
			logs: []
		})
		
		return this.update(job,detail)
			
		
	}
	
	/**
	 * Add a log record to job status detail
	 *
	 * @param jobId
	 * @param id - unique log id
	 * @param level
	 * @param message
	 * @param timestamp
	 * @param error
	 * @param details
	 */
	@ActionReducer()
	log(jobId:string,id:string,level:JobLogLevel,message:string,timestamp:number,error:Error = null,...details:any[]) {
		return (jobState: JobState) => jobState.update('details', (details: List<IJobStatusDetail>) => {
			const detailIndex = details.findIndex(detail => detail.id === jobId)
			
			if (detailIndex === -1) {
				log.warn(`Unable to add log to job ${jobId} - not in detail list`)
			} else {
				details = details.update(detailIndex,(detail) => {
					// Update the detail object ref and add the log
					return assign({},detail,{
						logs:[...(detail.logs || []), {
							id,
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