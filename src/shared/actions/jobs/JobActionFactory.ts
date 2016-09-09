// IMPORTS
import * as uuid from 'node-uuid'
import {ActionFactory, ActionMessage, ActionReducer} from 'typedux'
import {List, Map} from 'immutable'
import {JobState, IJobStatusDetail, TJobLogLevel, JobLogLevel} from "shared/actions/jobs/JobState"
import {IJob, JobType, JobStatus, IJobSchedule, IJobLog} from 'shared/actions/jobs/JobTypes'
import {JobKey, JobsMaxCompleted} from "shared/Constants"
import {Provided} from 'shared/util/Decorations'
import {cloneObject} from "shared/util/ObjectUtil"


const
	log = getLogger(__filename)


function makeErrorDetails(error:Error) {
	let frames = []
	
	return {
		message: error.message,
			frames,
			stack: (() => {
				try {
					return error.stack
				} catch (err) {
					log.warn(`Unable to get stack trace`, err)
					return "Unable to get stack trace"
				}
			})()
	}
}

/**
 * Immutable job map
 */
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
	
	leaf():string {
		return JobKey;
	}
	
	/**
	 * Internal prune to use in multiple places
	 *
	 * @param jobState
	 * @returns {Map<string, List<any>>}
	 */
	private pruneMutating = (jobState:JobState) => {
		let details = _.orderBy(jobState.details.toArray(), ['updatedAt'], ['desc'])
		
		let index:number
		
		while ((index = details.findIndex(it => it.status >= JobStatus.Completed)) > -1 &&
		details.length > JobsMaxCompleted) {
			
			details.splice(index, 1)
		}
		
		
		let allJobs = jobState.all
		
		const
			jobIds = details.map(it => it.id),
			allJobIds = allJobs.keySeq().toArray()
		
		// filter removed or missing jobs
		allJobIds
			.filter(it => !jobIds.includes(it))
			.forEach(it => allJobs = allJobs.remove(it))
		
		
		return jobState.set('details', List().push(...details)).set('all', allJobs)
		
	}
	
	/**
	 * Prune the jobs list
	 */
	@ActionReducer()
	prune() {
		return (jobStateIM:JobState) => jobStateIM
			.withMutations(this.pruneMutating)
	}
	
	private updateDetail = (jobState:JobState, detail:IJobStatusDetail) => this.pruneMutating(jobState
		.update('details', (details:List<IJobStatusDetail>) => {
			if (!details || !details.push)
				details = List<IJobStatusDetail>()
			
			// Set the updated timestamp
			detail = _.cloneDeep(detail)
			detail.updatedAt = Date.now()
			
			const
				index = details.findIndex(it => it.id === detail.id),
				existingDetail = (index > -1) && details.get(index)
			
			if (existingDetail)
				detail.logs = _.sortBy(_.uniqBy([...detail.logs, ...existingDetail.logs], 'id'), 'timestamp')
			
			//details = details.filter(it => it.id !== detail.id).toList()
			return index === -1 ?
				details.push(detail) :
				details.set(index, detail)
		}) as any)
	
	
	
	/**
	 * Clear all job info - really for testing only
	 */
	@ActionReducer()
	clear(includeRunning = false) {
		return (jobStateIM:JobState) => jobStateIM
			.withMutations(jobState => jobState
				.update('all', all => includeRunning ?
					all.clear() :
					all.filter((jobId,job:IJob) => job.status < JobStatus.Completed))
				.update('details', details => includeRunning ?
					details.clear() :
					details.filter(detail => !includeRunning && detail.status < JobStatus.Completed)))
	}
	
	/**
	 * Set job status detail
	 * @param detail
	 */
	@ActionReducer()
	setDetail(detail:IJobStatusDetail) {
		return (jobState:JobState) => this.updateDetail(jobState, detail)
	}
	
	/**
	 * Set all the current job schedules
	 *
	 * @param schedules
	 * @returns {(jobState:JobState)=>Map<string, any>}
	 */
	@ActionReducer()
	setSchedules(...schedules:IJobSchedule[]) {
		return (jobState:JobState) => jobState.set('schedules',
			schedules.reduce((map:Map<string,IJobSchedule>, schedule) => {
				return map.set(schedule.id, schedule)
			}, Map<string,IJobSchedule>()))
	}
	
	
	/**
	 * Cancel a job
	 *
	 * @param jobId
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	@ActionReducer()
	cancel(jobId:string) {
		return (jobState:JobState) => jobState.update('all', (all:Map<string,IJob>) => {
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
	update(job:IJob, detail:IJobStatusDetail) {
		return (jobStateIM:JobState) => this.pruneMutating(jobStateIM.withMutations((jobState:JobState) => {
			// Update Job first
			const allJobs:TJobIMap = jobState.all
			
			const
				existingJob = allJobs.valueSeq().find(it => it.id === job.id),
				newJob = existingJob ?
					cloneObject(existingJob, job) :
					cloneObject(job)
			
			jobState = jobState.set('all', allJobs.set(job.id, newJob)) as any
			
			return this.updateDetail(jobState, detail)
			
		}) as any)
	}
	
	/**
	 * Remove an existing job and its status detail from the state
	 *
	 * @param jobId
	 */
	@ActionReducer()
	remove(jobId:string) {
		return (jobStateIM:JobState) => this.pruneMutating(jobStateIM.withMutations((jobState:JobState) => {
			
			// Remove job first
			jobState = jobState.update('all', (allJobs:Map<string,IJob>) => allJobs.remove(jobId)) as any
			
			// Now remove detail
			jobState = jobState.update('details', (details:List<IJobStatusDetail>) => {
				const index = details.findIndex(detail => detail.id === jobId)
				if (index > -1)
					details = details.delete(index)
				
				return details
			}) as any
			
			return jobState
		}) as any)
	}
	
	
	/**
	 * Create a new job
	 *
	 * @param type
	 * @param description
	 * @param args
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	
	create(type:JobType,
	       description:string = JobType[type],
	       args:any = {}) {
		
		
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
		const detail = assign(_.pick(job, 'id', 'status', 'type'), {
			createdAt: Date.now(),
			updatedAt: Date.now(),
			progress: 0,
			logs: []
		}) as IJobStatusDetail
		
		this.update(job, detail)
		
		return {job, detail}
		
		
	}
	
	/**
	 * Set the selected job id
	 *
	 * @param id
	 * @returns {(jobState:JobState)=>Map<string, string>}
	 */
	@ActionReducer()
	setSelectedId(id:string) {
		return (jobState:JobState) => jobState.set('selectedId', id).set('selectedLogId',null)
	}
	
	
	/**
	 * Select a log record
	 *
	 * @param id
	 */
	@ActionReducer()
	setSelectedLogId(id:string) {
		return (jobState:JobState) => jobState.set('selectedLogId',id)
	}
	
	/**
	 * Add a job log record
	 *
	 * @param jobId
	 * @param jobLog
	 */
	@ActionReducer()
	addLog(jobId:string,jobLog:IJobLog) {
		return (jobState:JobState) => jobState.update('details', (details:List<IJobStatusDetail>) => {
			const detailIndex = details.findIndex(detail => detail.id === jobId)
			
			if (detailIndex === -1) {
				log.warn(`Unable to add log to job ${jobId} - not in detail list`)
			} else {
				details = details.update(detailIndex, (detail) => {
					// Update the detail object ref and add the log
					return assign({}, detail, {
						logs: _.orderBy([...(detail.logs || []), jobLog],['timestamp'],['desc'])
					})
				})
			}
			
			return details
		})
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
	
	log(jobId:string, id:string, level:JobLogLevel, message:string, timestamp:number, error:Error = null, ...details:any[]) {
		let errorDetails = null
		if (error) {
			errorDetails = makeErrorDetails(error)
		}
		this.addLog(jobId,{
			id,
			level: JobLogLevel[level] as TJobLogLevel,
			message,
			timestamp,
			error,
			errorDetails,
			details
		})
	}
}

export default JobActionFactory