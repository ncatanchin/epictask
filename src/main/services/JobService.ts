import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Container} from 'typescript-ioc'
import {BaseService} from './IService'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {JobHandler, JobHandlerEventType} from 'shared/actions/jobs/JobHandler'
import * as assert from 'assert'
import {Toaster} from 'shared/Toaster'
import {IEnumEventRemover} from 'shared/util/EnumEventEmitter'
import {Job, IJob, JobInfo, JobStatus} from 'shared/actions/jobs/JobState'

const log = getLogger(__filename)

export type TScheduledJobMap = {[name:string]:Job}

export type TJobClassType = typeof Job
export type TJobClassMap<J extends TJobClassType> = {[name:string]:J}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
}

export type TJobMap= {[name:string]:IJobContainer}

/**
 * Job handler events
 *
 * @type {JobHandlerEventType}
 */
const JobHandlerEvents = JobHandler.Events

/**
 * Job executor shape
 */
export interface IJobExecutor {
	(handler:JobHandler):void
}


/**
 * Job Service for managing all operations
 */
export default class JobService extends BaseService {

	private killed = false

	/**
	 * Keeps track of all Job Classes and Types
	 * @type {TJobClassMap<any>}
	 */
	private jobClassMap:TJobClassMap<any> = {}


	/**
	 * Currently coworking jobs
	 *
	 * @type {TJobMap}
	 */
	private jobMap:TJobMap = {}

	private jobsCtx

	//@Inject
	store:ObservableStore<any> = Container.get(ObservableStore as any) as any

	//@Inject
	jobActions:JobActionFactory = Container.get(JobActionFactory)

	//@Inject
	repoActions:RepoActionFactory = Container.get(RepoActionFactory)

	//@Inject
	toaster:Toaster = Container.get(Toaster)

	private loadJobs() {
		if (this.killed) return

		const ctx = this.jobsCtx = require
			.context('./jobs',true,/Job\.ts$/)

		ctx.keys().forEach(ctx)

		if (module.hot) {
			module.hot.accept([ctx.id],(updated) => {
				// TODO - unload old jobs

				Object.keys(this.jobMap)
					.forEach(key => delete this.jobMap[key])

				this.loadJobs()
			})
		}
	}

	getJobTypes() {
		return Object.keys(this.jobClassMap).join(',')
	}

	/**
	 * Register a job class
	 *
	 * @param jobClazz
	 * @param name
	 * @return {TJobClassMap<any>}
	 */
	registerJob<J extends TJobClassType>(name:string, jobClazz:J) {
		if (this.killed) return null

		// Add the name to the prototype
		Object.defineProperty(jobClazz.prototype,'name',{
			get: function() {
				return this._name || name
			},
			set: function(newName) {
				if (newName)
					this._name = newName
			}
		})

		this.jobClassMap[name] = jobClazz

		const job:Job = new (jobClazz as any)()
		if (job.scheduled) {
			this.createJob(job)
		}

		return this.jobClassMap

	}

	newJobInstance(name:string,job:IJob) {
		const clazz = this.jobClassMap[name]
		assert(clazz,`Unable to find class for job named ${name}, available classes are: ${this.getJobTypes()}`)

		return new clazz(job)
	}




	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobService}
	 */
	async start():Promise<this> {
		await super.start()


		// Now load everything
		const {state} = this.jobActions
		this.updateJobInfo()

		/**
		 * Watch for job updates
		 */
		this.store.observe([this.jobActions.leaf(), 'pendingJobs'], (pendingJobs) => {
			log.debug('Check new jobs for anything that need to be worked')
			this.checkPendingJobs(pendingJobs)
		})


		log.info("Finally load all jobs")
		this.loadJobs()

		return this
	}


	checkPendingJobs(pendingJobs:List<IJob>) {
		const newJobs = pendingJobs
			.filter(job => !this.jobMap[job.id]) // filter out existing jobs

		newJobs.forEach(job => this.createJob(job))

		this.jobActions.clearPendingJobs()
	}

	/**
	 * On a job event, handle it!
	 *
	 * @param event
	 * @param handler
	 * @param job
	 * @param info
	 */
	onJobEvent = (event:JobHandlerEventType, handler:JobHandler, job:Job, info:JobInfo) => {
		this.updateJobInfo()
	}

	createJob(newJob:IJob) {
		if (this.killed) return

		if (newJob.oneAtATime) {
			log.debug(`Job ${newJob.name} executed one at a time, looking for any current jobs`)
			const existingJob = this.findExistingJob(newJob)

			if (existingJob) {
				log.warn(`Job ${newJob.name} executes one at a time, found in progress job ${existingJob && existingJob.id}`)
				throw new Error('Job already exists in one at a time mode')
			}
		}

		const job = this.newJobInstance(newJob.name,newJob)

		// Create a new handler
		const handler = new JobHandler(this,job)

		// Attach to all events
		const eventRemovers:IEnumEventRemover[] = Object.keys(JobHandlerEvents)
			.filter(eventType => _.isNumber(eventType))
			.map(eventType => handler.on(eventType as any,this.onJobEvent))

		this.jobMap[job.id] = {eventRemovers,handler}

		this.updateJobInfo()
		handler.start()
		return handler

	}

	updateJobInfo() {
		const infos = Object
			.values(this.jobMap)
			.map(({handler}) => handler.info)

		this.jobActions.setJobsInfo(List(infos))
	}


	/**
	 * Find an existing job that matches the
	 * current job request
	 *
	 * @returns {Job}
	 * @param nameOrId
	 */
	findExistingJob(nameOrId) {
		if (this.killed) return null

		const workingJobs = this.jobMap
		const container = this.jobMap[nameOrId] || Object
			.values(workingJobs)
			.find(({handler}) => handler.job.status < JobStatus.Completed && handler.job.name === nameOrId)

		return container ? container.handler.job : null

	}

	removeJob(id:string) {
		delete this.jobMap[id]
	}

	completedJob(handler:JobHandler,status:JobStatus) {
		if (this.killed) return

		const {job} = handler
		switch (status) {
			case JobStatus.Failed:
				this.toaster.addErrorMessage(handler.info.error)
				break
			default:
				this.toaster.addMessage('Completed: ' + (job.description || job.name))
		}

		if (job.scheduled) {
			handler.reset()
		} else {
			this.removeJob(job.id)
		}
	}

	/**
	 * Clear a scheduled job
	 *
	 * @param jobOrString
	 */
	cancelJob = (jobOrString:Job|string) => {
		let container = Object.values(this.jobMap)
				.find(({handler}) => handler.job.id ===  ((jobOrString instanceof Job) ? jobOrString.id : jobOrString))


		assert(container,'No job found with argument: ' + jobOrString)
		const {handler} = container

		try {
			handler.cancel()
		} catch (err) {
			log.error('failed to cancel job, removing ref anyway',err)
		}

		if (handler.job.schedule) {
			handler.reset()
		} else {
			delete this.jobMap[handler.job.id]
		}

	}


	kill() {
		assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		Object.values(this.jobMap).forEach(jobContainer => {
			try {
				jobContainer.handler.kill()
			} catch (err) {
				log.error(`Failed to stop job - still clearing`,err,jobContainer.handler)
			}
		})
		this.jobMap = {}
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		try {
			const jobService = Container.get(JobService)
			jobService.kill()
		} catch (err) {
			log.error(`hmr dispose of jobservice failed`, err)
		}
	})
}


