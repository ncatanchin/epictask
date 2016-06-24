import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {ActionMessage} from 'typedux'

import * as assert from 'assert'
import {JobStatus} from './JobStatus'
import {JobHandler} from './JobHandler'
import * as uuid from 'node-uuid'

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

@RecordModel()
class JobStateModel {

	@RecordProperty()
	jobs:IJob[]

	@RecordProperty()
	error:Error

	@RecordProperty()
	scheduledJobs:IScheduledJob[]

	updateJob(updatedJob:IJob) {
		const existingJob = this.jobs.find(job => job.id === updatedJob.id)
		if (existingJob)
			updatedJob = Object.assign({},existingJob,updatedJob)

		Object.assign(updatedJob,{updatedAt:Date.now()})

		this.jobs = this.jobs
			.filter(job => job.id !== updatedJob.id)
			.concat([updatedJob])

		return this
	}

	createJob(request:IJobRequest) {
		if (request.oneAtATime) {
			log.debug(`Job ${request.name} executed one at a time, looking for any current jobs`)
			const existingJob = findInProgressJob(this,request)

			if (existingJob) {
				log.warn(`Job ${request.name} executes one at a time, found in progress job ${existingJob && existingJob.id}`, request, existingJob)
				return
			}
		}

		const job = {
			id: uuid.v4(),
		    request,
			name: request.name,
			progress: 0,
			status: JobStatus.Created
		}
		return this.updateJob(job)
	}

	removeJob(oldJob:IJob|string) {
		this.jobs = this.jobs
			.filter(job => (typeof oldJob === 'string') ?
				oldJob !== job.id : oldJob.id !== job.id)

		return this
	}

	/**
	 * Remove a scheduled job
	 *
	 * @param idOrName
	 * @returns {JobStateModel}
	 */
	removeScheduledJob(idOrName:string) {
		this.scheduledJobs = this.scheduledJobs
			.filter(job => ![job.id,job.name].includes(idOrName))
		return this
	}

	/**
	 * Add a scheduled job to the
	 * the state - the @see JobManager is
	 * then responsible for scheduling etc
	 *
	 * @param scheduledJob
	 * @returns {JobStateModel}
	 */
	addScheduledJob(scheduledJob:IScheduledJob) {

		const existingJobs = this.scheduledJobs,
			existingJob = existingJobs.find(job => job.name === scheduledJob.name ||
				job.id === scheduledJob.id)

		if (existingJob) {
			log.warn(`Probably HMR: An existing job with a matching name (${scheduledJob.name}) or id (${scheduledJob.id}) already exists`)
			return
		}


		this.scheduledJobs = existingJobs.concat([scheduledJob])
		return this
	}



	setError(err:Error) {
		this.error = err
		return this
	}
}

const JobStateDefaults = {
	jobs: [],
	scheduledJobs: []
}

export const JobState = makeRecord(JobStateModel,JobStateDefaults)
export type TJobState = typeof JobState

export interface JobMessage extends ActionMessage<typeof JobState> {

}

