// IMPORTS
import { ActionFactory, ActionMessage, ActionReducer } from "typedux"
import { List, Map } from "immutable"
import { JobState } from "../state/JobState"
import { IJobStatusDetail, IJob, JobStatus, IJobSchedule, TJobIMap } from "../state/jobs/JobTypes"
import { JobKey, JobsMaxCompleted, Provided, cloneObjectShallow, RegisterActionFactory } from "epic-global"


const
	log = getLogger(__filename)


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/
@RegisterActionFactory
@Provided
export class JobActionFactory extends ActionFactory<JobState,ActionMessage<JobState>> {
	
	static leaf = JobKey
	
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
		let
			details:List<IJobStatusDetail> = jobState
				.details
				.sortBy(it => moment(it.updatedAt).valueOf() * -1) as any
		
		while (true) {
			const
				index = details.findIndex(it => it.status >= JobStatus.Completed)
			
			if (index === -1 || details.size <= JobsMaxCompleted) {
				break
			}
			
			// REMOVE THE FIRST (OLDEST) JOB STATUS
			details = details.unshift()
		}
		
		
		let
			allJobs = jobState.all,
			jobIds = allJobs.keySeq().toArray(),
			validJobIds = details.map(it => it.id)
		
		jobIds
			.filter(it => !validJobIds.includes(it))
			.forEach(it => allJobs = allJobs.remove(it) as any)
		
		return jobState
			.set('details', details)
			.set('all', allJobs)
		
	}
	
	/**
	 * Update a detail status
	 *
	 * @param jobState
	 * @param detail
	 */
	private updateDetail = (jobState:JobState, detail:IJobStatusDetail) => jobState
		.set('details', jobState.details.withMutations((details:List<IJobStatusDetail>) => {
			
			if (details && !List.isList(details)) {
				details = List<IJobStatusDetail>(details)
			}
			
			if (!details)
				details = List<IJobStatusDetail>()
			
			// Set the updated timestamp
			detail = cloneObjectShallow(detail)
			detail.updatedAt = Date.now()
			
			const
				index = details.findIndex(it => it.id === detail.id)
			
			//details = details.filter(it => it.id !== detail.id).toList()
			return index === -1 ?
				details.push(detail) :
				details.set(index, detail)
		}))
	
	
	/**
	 * Prune the jobs list
	 */
	@ActionReducer()
	prune() {
		return (jobStateIM:JobState) => jobStateIM
			.withMutations(this.pruneMutating)
	}
	
	
	
	
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
			const
				job = all.valueSeq().find(it => it.id === jobId)
			
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
		return (jobState:JobState) => this.pruneMutating(jobState.withMutations((newJobState:JobState) => {
			// Update Job first
			const
				allJobs:TJobIMap = newJobState.all,
				existingJob = allJobs.valueSeq().find(it => it.id === job.id),
				newJob = existingJob ?
					cloneObjectShallow(existingJob, job) :
					cloneObjectShallow(job)
			
			newJobState = newJobState
				.set('all', newJobState.all.set(job.id, newJob)) as any
			
			return this.updateDetail(newJobState, detail)
			
		}) as any)
	}
	
	/**
	 * Remove an existing job and its status detail from the state
	 *
	 * @param jobId
	 */
	@ActionReducer()
	remove(jobId:string) {
		return (jobState:JobState) => this.pruneMutating(jobState.withMutations((newJobState:JobState) => {
			
			// Remove job first
			newJobState = newJobState.update('all', (allJobs:Map<string,IJob>) => allJobs.remove(jobId)) as any
			
			// Now remove detail
			newJobState = newJobState.update('details', (details:List<IJobStatusDetail>) =>
				details.filter(it => it.id !== jobId)) as any
			
			return newJobState
		}) as any)
	}
	
	
	
	
	
}

export default JobActionFactory