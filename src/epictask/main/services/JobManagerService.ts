import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject,Container, Scope} from 'typescript-ioc'

import {IService, ServiceStatus} from './IService'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {IJob,IScheduledJob} from 'shared/actions/jobs/JobState'
import {findInProgressJob} from 'shared/actions/jobs/JobReducer'
import {JobStatus} from 'shared/actions/jobs/JobStatus'
import {JobHandler} from 'shared/actions/jobs/JobHandler'

const log = getLogger(__filename)


export class SyncAllReposJob {



	name = 'Sync-Enabled Repos'
	schedule = '*/10 * * * *' // Every 10 minutes
	repeat = true
	oneAtATime = true


	executor = async (handler:JobHandler) => {
		log.info(`Starting to sync all repos`)
		Container.get(RepoActionFactory).syncAllRepoDetails()
	}
}

@AutoWired
@Singleton
export default class JobService implements IService {

	private _status = ServiceStatus.Created

	@Inject
	store:ObservableStore<any>

	@Inject
	jobActions:JobActionFactory

	@Inject
	repoActions:RepoActionFactory

	private workingJobs = {}
	private scheduledJobs:{[name:string]:IScheduledJob} = {}


	status():ServiceStatus {
		return this._status
	}

	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		return this
	}

	async start():Promise<this> {
		this._status = ServiceStatus.Started

		// Now load everything
		const {state} = this.jobActions
		this.updateJobs(state.jobs)
		this.updateScheduledJobs(state.scheduledJobs)

		const syncAllReposJob = new SyncAllReposJob()
		this.jobActions.createJob(this.scheduledJobToRequest(syncAllReposJob))
		this.jobActions.scheduleJob(syncAllReposJob)

		/**
		 * Watch for job updates
		 */
		this.store.observe([this.jobActions.leaf(),'jobs'],(newJobs) => {
			log.debug('Check new jobs for anything that need to be worked')
			this.updateJobs(newJobs)
		})

		/**
		 * Watch for new scheduled jobs
		 */
		this.store.observe([this.jobActions.leaf(),'scheduledJobs'],(newScheduledJobs) => {
			log.debug('Scheduled jobs changed',newScheduledJobs)
			this.updateScheduledJobs(newScheduledJobs)
		})
		return this
	}

	async stop():Promise<this> {

		this._status = ServiceStatus.Stopped

		return this
	}

	destroy():this {
		return this
	}


	/**
	 * Execute a pending job
	 *
	 * @param job
	 */

	async executeJob(job:IJob) {
		this.workingJobs[job.id] = job
		log.info(`Executing job ${job.id}`)
		const handler = new JobHandler(this.jobActions,job)
		await handler.execute()
		log.info(`Job Completed`)
	}

	/**
	 * Update pending jobs
	 *
	 * @param newJobs
	 */
	updateJobs(newJobs:List<IJob>) {

		// Pending jobs = any job that is 'Created' and we dont know about
		const pendingJobs = newJobs
			.filter(job => job.status === JobStatus.Created && !this.workingJobs[job.id])

		pendingJobs.forEach(this.executeJob.bind(this))
		this.jobActions.setJobs(newJobs)

	}


	/**
	 * Clear a scheduled job
	 *
	 * @param job
	 */
	clearScheduledJob = (job:IScheduledJob) => {
		log.debug(`Removing job ${job.name}`)
		if (job.timer) {
			log.debug(`Calling cancel on ${job.name}/${job.id}`)
			job.timer.clear()
		}

		delete this.scheduledJobs[job.id]
	}

	scheduledJobToRequest = (job) => {
		return {
			name: job.name,
			oneAtATime: job.oneAtATime,
			executor: job.executor
		}
	}

	scheduledJobExecutor = (job:IScheduledJob) => {
		return () => {
			if (job.oneAtATime) {
				const existingJob = findInProgressJob(this.jobActions.state,job)
				if (existingJob) {
					log.info(`Scheduled job ${job.name} is already executing, lets wait till next time`, existingJob,job)
					return
				}
			}

			const jobRequest = this.scheduledJobToRequest(job)

			log.debug(`Creating scheduled job execution`,job,jobRequest)

			this.jobActions.createJob(jobRequest)
		}
	}

	updateScheduledJobs(newScheduledJobs:List<IScheduledJob>) {
		const
			allIds = newScheduledJobs.map(job => job.id),
			allNames = newScheduledJobs.map(job => job.name),
			oldIds = Object.keys(this.scheduledJobs),
			oldNames = oldIds.map(id => this.scheduledJobs[id].name),
			removedIds = oldIds.filter(id => !allIds.includes(id)),
			removedJobs = removedIds.map(id => this.scheduledJobs[id]),
			newIds = allIds.filter(id => !oldIds.includes(id)),
			newJobs = List(newScheduledJobs.filter(job => newIds.includes(job.id)))

		log.debug('Scheduling new jobs', newJobs, ' and removing ', removedJobs)

		// Remove + clear jobs first
		removedJobs.forEach(this.clearScheduledJob)

		newJobs.forEach((job:IScheduledJob) => {
			const executor = this.scheduledJobExecutor(job)
			job.timer = (job.repeat) ? later.setInterval(executor,job.scheduler) :
				later.setTimeout(executor,job.scheduler)

			this.scheduledJobs[job.id] = job
		})

	}

}

