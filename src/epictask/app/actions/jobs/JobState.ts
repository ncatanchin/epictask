import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {JobStatus} from './JobStatus'
import {JobHandler} from './JobHandler'
import * as uuid from 'node-uuid'

export interface IJob {
	id:string
	status:JobStatus
	progress:number
	request:IJobRequest
	handler?:JobHandler
	message?:string
	error?:Error
	updatedAt?:number
}


export interface IJobExecutor {
	(handler:JobHandler):void
}


export interface IJobRequest {
	oneAtATime?:boolean
	executor:IJobExecutor
}

@RecordModel()
class JobStateModel {

	@RecordProperty()
	jobs:IJob[]

	@RecordProperty()
	error:Error


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
		const job = {
			id: uuid.v4(),
			    request,
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




	setError(err:Error) {
		this.error = err
		return this
	}
}



const JobStateDefaults = {
	jobs: []
}

export const JobState = makeRecord(JobStateModel,JobStateDefaults)
export type TJobState = typeof JobState