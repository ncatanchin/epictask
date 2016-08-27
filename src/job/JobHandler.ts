import * as moment from 'moment'
import * as uuid from 'node-uuid'


import {JobManager} from "JobManagerService"
import {EnumEventEmitter} from 'shared/util/EnumEventEmitter'
import {JobStatusDetails, JobStatus} from 'shared/actions/jobs/JobState'
import {IJob} from "shared/actions/jobs/JobTypes"
const log = getLogger(__filename)




export enum JobHandlerEventType {
	Started = 1,
	Changed,
	Finished
}

/**
 * Job Event names
 *
 * @type {string}
 */
export type TJobHandlerEventType = 'Started' | 'Changed' | 'Finished'

/**
 * Handler for executing a job
 */
export class JobHandler extends EnumEventEmitter<JobHandlerEventType> {

	private executePromise
	private killed = false

	private executor:IJobExecutor
	
	scheduler:Later.IScheduleData

	info:JobStatusDetails
	timer:Later.ITimer

	constructor(public service:JobManager,public job:IJob) {
		super(JobHandlerEventType)

		this.executor = service.newExecutor(job)
		
		

	}

	/**
	 * When the internal state
	 * is updated
	 */
	private notify(event:JobHandlerEventType) {
		this.emit(event,this.job,this.info)
	}

	/**
	 * Update job status
	 *
	 * @param message
	 * @param details
	 * @param error
	 */
	log(message:string,details:string,error:Error) {
		this.info.log(message,details,error)
		this.notify(JobHandlerEventType.OnChanged)
	}

	kill() {
		this.killed = true
		if (this.timer) {
			this.timer.clear()
			this.timer = null
		}
	}

	/**
	 * Start the handler
	 *
	 * for a repeating scheduled job the
	 * same handler is used.  `this.info`
	 * is reset after each execution
	 */
	start() {
		this.reset()
		if (this.scheduler && this.job.immediate) {
			this.execute()
		}

		this.notify(JobHandler.Events.OnStarted)
	}

	/**
	 * Reset/Init the job info and schedule
	 */
	reset() {
		if (this.killed) return

		this.info = new JobStatusDetails()
		this.info.id = uuid.v4()
		this.info.jobId = this.job.id
		this.info.description = this.job.description

		if (this.scheduler)
			this.schedule()
		else
			this.execute()
	}

	/**
	 * Schedule the job for later execution
	 */
	schedule() {
		if (!this.timer) {
			assert(this.scheduler,'Schedule must be set in order to schedule')

			const executor = () => this.execute()

			this.timer = (this.job.repeat) ?
				later.setInterval(executor, this.scheduler) :
				later.setTimeout(executor, this.scheduler)

		}

		const nextOccurrence =  later.schedule(this.scheduler).next(1)

		this.info.nextScheduledTime = Array.isArray(nextOccurrence) ? nextOccurrence[0] : nextOccurrence

		const nextText = moment(nextOccurrence).fromNow()
		log.info(`Scheduled Job ${this.job.name} occurs next ${nextText}`)

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
					
					// TODO: Fix Job Resolve
					//const result = await job.executor(this)
					//resolve(result)
					resolve(true)
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
				this.notify(JobHandler.Events.OnFinished)
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
