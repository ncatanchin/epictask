import {JobStatus} from './JobStatus'
import {DefaultLeafReducer} from 'typedux'
import {JobKey} from "shared/Constants"
import {JobMessage, JobState, IJob, IJobRequest, IScheduledJob} from './JobState'
import {List} from 'immutable'
const log = getLogger(__filename)
import * as uuid from 'node-uuid'

/**
 * Find an existing job that matches the
 * current job request
 *
 * @param state
 * @param name
 * @returns {T|undefined}
 */
export function findInProgressJob(state,{name}) {
	return state.jobs
		.find(job => job.status < JobStatus.Completed && job.name === name)
}



export class JobReducer extends DefaultLeafReducer<JobState,JobMessage> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState():any {
		return new JobState()
	}


	updateJob(state:JobState,updatedJob:IJob) {
		const index = state.jobs.findIndex(job => job.id === updatedJob.id)

		return state.merge({
			jobs: (index === -1) ? state.jobs.push(updatedJob) :
				state.jobs.set(index,updatedJob)
		})


	}

	createJob(state:JobState,request:IJobRequest) {
		if (request.oneAtATime) {
			log.debug(`Job ${request.name} executed one at a time, looking for any current jobs`)
			const existingJob = findInProgressJob(state,request)

			if (existingJob) {
				log.warn(`Job ${request.name} executes one at a time, found in progress job ${existingJob && existingJob.id}`)
				return state
			}
		}

		const job = {
			id: uuid.v4(),
			request,
			name: request.name,
			progress: 0,
			status: JobStatus.Created
		}
		return this.updateJob(state,job)
	}

	removeJob(state:JobState,oldJob:IJob|string) {
		return state.merge({
			jobs: state.jobs
				.filter(job => (typeof oldJob === 'string') ?
					oldJob !== job.id : oldJob.id !== job.id)
		})
	}

	setJobs(state:JobState,jobs:List<IJob>) {
		return state.merge({jobs})
	}

	/**
	 * Remove a scheduled job
	 *
	 * @param idOrName
	 * @returns {JobStateModel}
	 */
	removeScheduledJob(state:JobState,idOrName:string) {
		return state.merge({
			scheduledJobs: state.scheduledJobs
				.filter(job => ![job.id, job.name].includes(idOrName))
		})
	}

	/**
	 * Add a scheduled job to the
	 * the state - the @see JobManager is
	 * then responsible for scheduling etc
	 *
	 * @param scheduledJob
	 * @returns {JobStateModel}
	 */
	addScheduledJob(state:JobState,scheduledJob:IScheduledJob) {
		const existingJobs = state.scheduledJobs,
			existingJob = existingJobs.find(job => job.name === scheduledJob.name ||
				job.id === scheduledJob.id)

		if (existingJob) {
			log.warn(`Probably HMR: An existing job with a matching name (${scheduledJob.name}) or id (${scheduledJob.id}) already exists`)
			return state
		}

		return state.merge({
			scheduledJobs: existingJobs.push(scheduledJob)
		})

	}

	setScheduledJobs(state:JobState,scheduledJobs:List<IScheduledJob>) {
		return state.merge({scheduledJobs})
	}

	setError(state:JobState,err:Error) {
		return state.merge({error:err})
	}
}