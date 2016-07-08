import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject, Container, Scope} from 'typescript-ioc'
import {ServiceStatus, BaseService} from './IService'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {IJob, BaseJob} from 'shared/actions/jobs/JobReducer'
import {JobStatus} from 'shared/actions/jobs/JobStatus'
import {JobHandler} from 'shared/actions/jobs/JobHandler'
import * as assert from 'assert'
import {Toaster} from 'shared/Toaster'

const log = getLogger(__filename)

export type TScheduledJobMap = {[name:string]:BaseJob}

export type TJobClassType = typeof BaseJob
export type TJobClassMap<J extends TJobClassType> = {[name:string]:J}
export type TJobMap= {[name:string]:JobHandler}


/**
 * Job executor shape
 */
export interface IJobExecutor {
	(handler:JobHandler):void
}

@AutoWired
@Singleton
export default class JobService extends BaseService {

	/**
	 * Keeps track of all Job Classes and Types
	 * @type {TJobClassMap<any>}
	 */
	private jobClassMap:TJobClassMap<any> = {}

	/**
	 * Currently cowrking jobs
	 *
	 * @type {TJobMap}
	 */
	private jobMap:TJobMap = {}

	private jobsCtx

	@Inject
	store:ObservableStore<any>

	@Inject
	jobActions:JobActionFactory

	@Inject
	repoActions:RepoActionFactory

	@Inject
	toaster:Toaster

	private loadJobs() {
		const ctx = this.jobsCtx = require
			.context('./jobs',true,/Job\.ts$/)

		ctx.keys().forEach(ctx)

		if (module.hot) {
			module.hot.accept([ctx.id],(updated) => {
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
	 */
	registerJob<J extends TJobClassType>(name:string, jobClazz:J) {

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

		const job:BaseJob = new (jobClazz as any)()
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
	 * Initialize the job service
	 *
	 * @returns {JobService}
	 */
	async init():Promise<this> {
		await super.init()
		return this
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

	/**
	 * Stops the service and all pending or inprogress
	 * jobs
	 *
	 * @returns {JobService}
	 */
	async stop():Promise<this> {
		await super.stop()

		return this
	}

	destroy():this {
		return this
	}


	checkPendingJobs(pendingJobs:List<IJob>) {
		const newJobs = pendingJobs
			.filter(job => !this.jobMap[job.id]) // filter out existing jobs

		newJobs.forEach(job => this.createJob(job))

		this.jobActions.clearPendingJobs()
	}


	createJob(newJob:IJob) {
		if (newJob.oneAtATime) {
			log.debug(`Job ${newJob.name} executed one at a time, looking for any current jobs`)
			const existingJob = this.findInProgressJob(newJob)

			if (existingJob) {
				log.warn(`Job ${newJob.name} executes one at a time, found in progress job ${existingJob && existingJob.id}`)
				throw new Error('Job already exists in one at a time mode')
			}
		}

		const job = this.newJobInstance(newJob.name,newJob)
		const handler = new JobHandler(job)
		this.jobMap[job.id] = handler

		this.updateJobInfo()
		handler.start()
		return handler

	}

	updateJobInfo() {
		const infos = Object
			.values(this.jobMap)
			.map(handler => handler.info)

		this.jobActions.setJobsInfo(List(infos))
	}


	/**
	 * Find an existing job that matches the
	 * current job request
	 *
	 * @param state
	 * @param name
	 * @returns {T|undefined}
	 */
	findInProgressJob(nameOrId) {
		const workingJobs = this.jobMap
		const handler = Object
			.values(workingJobs)
			.find(handler => handler.job.status < JobStatus.Completed && handler.job.name === name)

		return handler ? handler.job : null

	}

	removeJob(id:string) {
		delete this.jobMap[id]
	}

	completedJob(handler:JobHandler,status:JobStatus) {
		switch (status) {
			case JobStatus.Failed:
				this.toaster.addErrorMessage(handler.info.error)
				break
			default:
				this.toaster.addMessage('Completed: ' + handler.job.name)
		}

		if (handler.job.scheduled) {
			handler.reset()
		} else {
			this.removeJob(handler.job.id)
		}
	}

	/**
	 * Clear a scheduled job
	 *
	 * @param job
	 */
	cancelJob = (jobOrString:BaseJob|string) => {
		let handler = Object.values(this.jobMap)
				.find(item => item.job.id ===  ((jobOrString instanceof BaseJob) ? jobOrString.id : jobOrString))

		assert(handler,'No job found with argument: ' + jobOrString)

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




}


/**
 * Annotation to register a job
 * on compilation
 *
 * @param target
 * @constructor
 */
export function Job(target:{new():IJob}) {
	const service = Container.get(JobService)
	service.registerJob(target.name,target)
}

/**
 * Keeps track of job scheduling
 */
export class JobSchedule {



	// Actual scheduling data
	scheduler:Later.IScheduleData

	// Cancel a job
	timer?:Later.ITimer
}

