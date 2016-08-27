import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Container} from 'typescript-ioc'

import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {JobHandler, JobHandlerEventType} from 'job/JobHandler'
import * as assert from 'assert'
import {Toaster} from 'shared/Toaster'
import {IEnumEventRemover} from 'shared/util/EnumEventEmitter'
import {IJob, JobStatus, JobType} from 'shared/actions/jobs/JobTypes'
import {IJobExecutorConstructor, loadAllExecutors, IJobExecutor} from "job/JobExecutors"
import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {AppStoreService} from "shared/services/AppStoreService"
import {DatabaseClientService} from "shared/services/DatabaseClientService"

const log = getLogger(__filename)

export type TScheduledJobMap = {[name:string]:IJob}

export type TJobExecutorClassMap = {[name:string]:IJobExecutorConstructor}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
}

export type TJobMap= {[name:string]:IJobContainer}


// Singleton ref
let jobManager:JobManager


/**
 * Type guard job
 *
 * @param jobOrString
 * @returns {any}
 */
function isJob(jobOrString:IJob|string):jobOrString is IJob {
	return _.isString((jobOrString as any).id)
}

/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.JobServer)
export class JobManager extends BaseService {

	static getInstance() {
		if (!jobManager) {
			jobManager = new JobManager()
		}
		
		return jobManager
	}
	
	
	private killed = false

	
	/**
	 * Keeps track of all Job Classes and Types
	 * @type {TJobExecutorClassMap<any>}
	 */
	private executorClassMap:TJobExecutorClassMap = {}


	/**
	 * Currently working jobs
	 *
	 * @type {TJobMap}
	 */
	private jobMap:TJobMap = {}
	
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	
	private store:ObservableStore<any>
	private jobActions:JobActionFactory
	private repoActions:RepoActionFactory
	private toaster:Toaster
	
	
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService,AppStoreService]
	}
	
	constructor() {
		super()
		
		assert(!jobManager,`Job Manager can only be instantiated once`)
	}
	
	
	
	getJobTypes() {
		return Object.keys(this.executorClassMap).join(',')
	}

	/**
	 * Register a job class
	 *
	 * @param executorConstructor
	 * @return {TJobExecutorClassMap}
	 */
	registerExecutor(executorConstructor:IJobExecutorConstructor) {
		
		log.info(`Registering Job: ${name}`)
		if (this.killed) {
			log.warn(`Job Process is killed, can not load ${name}`)
			return null
		}
		
		this.executorClassMap[executorConstructor.name] = executorConstructor
		
		return this.executorClassMap
	}
	
	/**
	 * Create a new JobExecutor
	 *
	 * @param job
	 */
	newExecutor(job:IJob):IJobExecutor {
		const
			{type} = job,
			name = JobType[type]
		
		log.info(`Looking for job ${name}`)
		
		const executorClazz = this.executorClassMap[name]
		assert(executorClazz,`Unable to find class for job named ${name}, available classes are: ${Object.keys(this.executorClassMap)}`)

		return new executorClazz(job)
	}
	
	
	async init():Promise<any> {
		this.store = Container.get(ObservableStore as any) as any
		this.jobActions = Container.get(JobActionFactory)
		this.repoActions = Container.get(RepoActionFactory)
		this.toaster = Container.get(Toaster)
		
		return super.init()
	}
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManager}
	 */
	async start():Promise<this> {
		
		// Now load everything
		this.updateJobInfo()

		// Watch for job updates
		this.unsubscriber = this.store.observe([this.jobActions.leaf(), 'pendingJobs'], (pendingJobs) => {
			log.debug('Check new jobs for anything that need to be worked')
			this.checkPendingJobs(pendingJobs)
		})
		
		log.info("Finally load all job executors")
		
		loadAllExecutors()
		
		return super.start()
	}
	
	
	/**
	 * Check the pending jobs
	 *
	 * @param pendingJobs
	 */
	checkPendingJobs(pendingJobs:List<IJob>) {
		pendingJobs
			.filter(job => !this.jobMap[job.id]) // filter out existing jobs
			.forEach(job => this.execute(job))

		this.jobActions.clearPendingJobs()
	}
	
	
	updateSchedules() {
		// const {schedule} = job
		// if (schedule) {
		// 	this.scheduler = later.parse.cron(schedule)
		// }
	}
	

	/**
	 * On a job event, handle it!
	 *
	 * @param event
	 * @param handler
	 * @param job
	 * @param info
	 */
	onJobEvent = (event:JobHandlerEventType, handler:JobHandler) => {
		this.updateJobInfo()
	}

	execute(job:IJob) {
		if (this.killed) return
		
		
		// Create a new executor
		const
			executor = this.newExecutor(job),
			handler = new JobHandler(this,job),

			// Attach to all events
			eventRemovers:IEnumEventRemover[] = handler.onAll(this.onJobEvent)

		this.jobMap[job.id] = {
			eventRemovers,
			handler
		}
		
		this.updateJobInfo()
		handler.start()
		
		return handler

	}

	updateJobInfo() {
		const infos = Object
			.values(this.jobMap)
			.map(({handler}) => handler.info)

		infos.forEach(info => this.jobActions.setJobInfo(info))
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

		// if (job.scheduled) {
		// 	handler.reset()
		// } else {
		// 	this.removeJob(job.id)
		// }
	}

	/**
	 * Clear a scheduled job
	 *
	 * @param jobOrString
	 */
	cancelJob = (jobOrString:IJob|string) => {
		let container = Object.values(this.jobMap)
				.find(({handler}) => handler.job.id ===  ((isJob(jobOrString)) ? jobOrString.id : jobOrString))


		assert(container,'No job found with argument: ' + jobOrString)
		const {handler} = container

		try {
			handler.cancel()
		} catch (err) {
			log.error('failed to cancel job, removing ref anyway',err)
		}

		// if (handler.job.schedule) {
		// 	handler.reset()
		// } else {
		// 	delete this.jobMap[handler.job.id]
		// }

	}


	kill() {
		//assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		
		if (this.unsubscriber)
			this.unsubscriber()
		
		
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


/**
 * Get the JobManager singleton
 *
 * @return {JobManager}
 */
export function getJobManager() {
	return JobManager.getInstance()
}

Container.bind(JobManager).provider({get: getJobManager})

export default getJobManager

//
// if (module.hot) {
// 	module.hot.dispose(() => {
// 		try {
// 			const jobService = Container.get(JobService)
// 			jobService.kill()
// 		} catch (err) {
// 			log.error(`hmr dispose of jobservice failed`, err)
// 		}
// 	})
// }


