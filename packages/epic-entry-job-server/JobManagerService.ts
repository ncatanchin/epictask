import {Map} from 'immutable'

import {JobHandler, JobHandlerEventType} from './JobHandler'
import * as assert from 'assert'
import {IEnumEventRemover} from "epic-common"
import {IJob, JobStatus, JobType} from "epic-typedux"
import {IJobExecutorConstructor, loadAllExecutors, IJobExecutor} from "./JobExecutors"
import {BaseService, RegisterService, IServiceConstructor} from "epic-services"
import {DatabaseClientService} from "epic-services"
import {IJobStatusDetail} from "epic-typedux"
import { JobKey } from "epic-global"
import {JobsMaxConcurrency} from 'epic-global'
import { clientObserveState, getStateValue } from "epic-typedux"
import { getHot, setDataOnHotDispose } from "epic-common"

const log = getLogger(__filename)



export type TJobExecutorClassMap = {[name:string]:IJobExecutorConstructor}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
	job:IJob
}

export type TJobMap= {[name:string]:IJobContainer}


// Singleton ref
let
	jobManager:JobManagerService

interface IJobPending {
	job:IJob
	detail:IJobStatusDetail
}

const
	pendingJobQueue = getHot(module,'pendingJobQueue',[]) as IJobPending[]

setDataOnHotDispose(module,() => ({pendingJobQueue}))

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
export class JobManagerService extends BaseService {

	static getInstance() {
		if (!jobManager) {
			jobManager = new JobManagerService()
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
	 * @type {TJobIMap}
	 */
	private workingJobs:TJobMap = {}
	
	
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
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
		
		const name = executorConstructor.name
		
		log.debug(`Registering Job: ${name}`)
		if (this.killed) {
			log.warn(`Job Process is killed, can not load ${name}`)
			return null
		}
		
		executorConstructor
			.supportedTypes()
			.forEach((type:JobType) =>
				this.executorClassMap[JobType[type]] = executorConstructor)
				
		
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
		
		log.debug(`Looking for job executor that can handle job type ${name}`)
		
		const executorClazz = this.executorClassMap[name]
		assert(executorClazz,`Unable to find class for job named ${name}, available classes are: ${Object.keys(this.executorClassMap)}`)

		return new executorClazz(job)
	}
	
	
	async init():Promise<any> {
		return super.init()
	}
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		log.info("Load executors")
		loadAllExecutors()
		
		
		this.unsubscriber = await clientObserveState([JobKey, 'all'], this.onJobsUpdated)
		
		
		// Execute default jobs
		const allJobs = await getStateValue(JobKey,'all')
		await this.onJobsUpdated(allJobs)
		
		
		
		// Watch for job updates
		log.debug('Subscribe for state updates')
		return super.start()
	}
	
	
	/**
	 * Check for new jobs, cancelled jobs, etc
	 *
	 * @param jobs
	 */
	onJobsUpdated = async (jobs:{[id:string]:IJob}) => {
		log.debug(`Checking jobs`,jobs)
		
		try {
			const
				newJobs = Object
					.values(jobs)
					.filter(job =>
					job &&
					job.status === JobStatus.Created && !this.workingJobs[ job.id ]),
				
				details = await getStateValue(JobKey, 'details')
			
			log.debug(`Found ${newJobs.length} new jobs, executing now`)
			
			newJobs.forEach(job => {
				this.execute(job, details.find(detail => detail.id === job.id))
			})
		} catch (err) {
			log.error(`Failed to updated jobs from state`,err)
		}
	}
	

	/**
	 * On a job event, handle it!
	 *
	 * @param event
	 * @param handler
	 * @param job
	 * @param detail
	 */
	onJobEvent = (event:JobHandlerEventType, handler:JobHandler, job:IJob, detail:IJobStatusDetail) => {
		const workingJob = this.workingJobs[job.id]
		
		if (workingJob && job.status >= JobStatus.Completed) {
			log.debug(`Removing ${job.name} (${job.id}) from working job list`)
			delete this.workingJobs[job.id]
			
			this.checkPendingQueue()
		}
			
	}
	
	/**
	 * Check pending queue for next job
	 */
	private checkPendingQueue = () => {
		if (pendingJobQueue.length) {
			const
				{job,detail} = pendingJobQueue.shift()
			
			if (job.status > JobStatus.Created) {
				log.error(`A pending job should not have a status above created`,job)
			} else {
				this.execute(job,detail)
			}
		}
	}
	
	/**
	 * Execute a job
	 *
	 * @param job
	 * @param detail
	 * @returns {JobHandler}
	 */
	execute = (job:IJob,detail:IJobStatusDetail) => {
		if (Object.keys(this.workingJobs).length > JobsMaxConcurrency) {
			log.debug(`Job is pending, max concurrency reached`,job,JobsMaxConcurrency)
			pendingJobQueue.push({job,detail})
			return
		}
		
		// Create a new executor
		const
			handler = new JobHandler(this,job,detail),

			// Attach to all events
			eventRemovers:IEnumEventRemover[] = handler.onAll(this.onJobEvent)

		this.workingJobs[job.id] = {
			eventRemovers,
			handler,
			job
		}
		
		log.debug(`Executing Job ${job.name} (${job.id})`)
		handler.execute()
			.then(() => {
				setTimeout(this.checkPendingQueue,10)
			})
	
		
		
		
	}

	
	/**
	 * Find an existing job that matches the
	 * current job request
	 *
	 *
	 * @param nameOrId
	 */
	findJob(nameOrId) {
		if (this.killed) return null

		const workingJobs = this.workingJobs
		const container = this.workingJobs[nameOrId] || Object
			.values(workingJobs)
			.find(({handler}) =>
				handler.job.status < JobStatus.Completed &&
				handler.job.name === nameOrId)

		return container ? container.handler.job : null

	}


	kill() {
		//assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		
		if (this.unsubscriber)
			this.unsubscriber()
		
		this.workingJobs = {}
	}
	
	
	
	
}


/**
 * Get the JobManager singleton
 *
 * @return {JobManagerService}
 */
export function getJobManager() {
	return JobManagerService.getInstance()
}

Container.bind(JobManagerService).provider({get: getJobManager})

export default getJobManager

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}


