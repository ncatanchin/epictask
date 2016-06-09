
import {JobStatus} from './JobStatus'
import {IJob} from './JobState'

const log = getLogger(__filename)

/**
 * Handler for executing a job
 */
export class JobHandler {

	private _job:IJob

	constructor(
		private actions,
		job:IJob
	) {
		this._job = job
	}

	get job():IJob {
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
		const job = Object.assign(
			{},
			this.job,
			{status},
			(progress > -1) ? {progress} : {},
			(err) ? {error:err} : {}
		)
		this._job = await this.actions.updateJob(job)
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