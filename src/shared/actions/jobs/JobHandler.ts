import {Container,AutoWired,Inject} from 'typescript-ioc'
import {JobStatus} from './JobStatus'
import JobService from 'main/services/JobService'
import {JobInfo, BaseJob} from 'shared/actions/jobs/JobReducer'
import * as moment from 'moment'
//import * as Bluebird from 'bluebird'
import * as uuid from 'node-uuid'
//import {IJob} from './JobState'

const log = getLogger(__filename)

/**
 * Handler for executing a job
 */
@AutoWired
export class JobHandler {

	private executePromise

	scheduler:Later.IScheduleData
	service = Container.get(JobService)
	info:JobInfo
	timer
	constructor(public job:BaseJob) {
		const {schedule} = job
		if (schedule) {
			this.scheduler = later.parse.cron(schedule)
		}

	}

	start() {
		this.reset()
		if (this.scheduler && this.job.immediate) {
			this.execute()
		}
	}

	reset() {
		this.info = new JobInfo()
		this.info.id = uuid.v4()
		this.info.jobId = this.job.id
		this.info.description = this.job.description

		if (this.scheduler)
			this.schedule()
		else
			this.execute()
	}

	schedule() {
		if (!this.timer) {
			assert(this.scheduler,'Schedule must be set in order to schedule')

			const executor = () => this.execute()

			this.timer = (this.job.repeat) ?
				later.setInterval(executor, this.scheduler) :
				later.setTimeout(executor, this.scheduler)

		} else {
			const nextOccurence = later.schedule(this.scheduler).next(1)
			const nextText = moment(nextOccurence).fromNow()
			log.info(`Scheduled Job ${this.job.name} occurs next ${nextText}`)
		}



	}


	/**
	 * Update the job status
	 *
	 * @param status
	 * @param progress
	 * @param error
	 * @returns {IJob}
	 */
	async setStatus(status:JobStatus, progress = -1, error:Error = null) {
		Object.assign(this.info,{
			status,
			progress,
			error
		})

		this.service.updateJobInfo()


	}

	/**
	 * Execute and return final job instance
	 *
	 * @returns {IJob}
	 */
	execute() {
		return (this.executePromise) ?
			this.executePromise :
			(this.executePromise = new Promise(async (resolve, reject) => {
				let job = this.job

				try {

					// Set job in-progress
					await this.setStatus(JobStatus.InProgress)
					const result = await job.executor(this)

					resolve(result)
				} catch (err) {
					log.error(`Job failed (id=${job.id})`,err)
					reject(err)
				}

				return this.job
			}).then(async (result) => {
				await this.setStatus(JobStatus.Completed)
				return result
			}).catch((err) => {
				// Set job failed
				log.error('Failed job', err)
				return this.setStatus(JobStatus.Failed,err)
			}).finally(() => {
				this.executePromise = null
				this.service.completedJob(this,this.info.status)
			}))


	}

	cancel() {
		if (this.executePromise) {
			this.executePromise.cancel()
			this.executePromise = null
		}
	}
}