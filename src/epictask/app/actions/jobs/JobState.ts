import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {JobHandler} from './'

export enum JobStatus {
	Created = 1,
	InProgress,
	Completed,
	Failed
}

export interface IJob {
	id:string
	status:JobStatus
	handler:JobHandler
	progress:number
	message?:string
	error?:Error
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

		this.jobs = this.jobs
			.filter(job => job.id !== updatedJob.id)
			.concat([updatedJob])

		return this
	}

	createJob(newJob:IJob) {
		return this.updateJob(newJob)
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