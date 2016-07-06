
import {JobStatus} from './JobStatus'
//import {IJob} from './JobState'

const log = getLogger(__filename)

/**
 * Handler for executing a job
 */
export class JobHandler {

	private _job

	constructor(
		private actions,
		job
	) {
		this._job = job
	}

	get job() {
		return this._job
	}

	/**
	 * Update the job status
	 *
	 * @param status
	 * @param progress
	 * @param err
	 * @returns {IJob}
	 */
	async setStatus(status:JobStatus, progress = -1, err:Error = null) {
		Object.assign(this.job,{status},
			(progress > -1) ? {progress} : {},
			(err) ? {error:err} : {})

		const job = Object.assign(
			{},
			_.cloneDeep(this._job)
		)

		this.actions.updateJob(job)

		return this.job
	}

	/**
	 * Execute and return final job instance
	 *
	 * @returns {IJob}
	 */
	async execute() {
		let job = this.job

		const {request} = job

		try {

			// Set job in-progress
			await this.setStatus(JobStatus.InProgress)

			await request.executor(this)

			// Set job completed
			await this.setStatus(JobStatus.Completed)
		} catch (err) {
			log.error(`Job failed (id=${job.id})`,err)
			await this.setStatus(JobStatus.Failed,err)
		}

		return this.job
	}
}