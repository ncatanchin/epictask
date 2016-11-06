import { JobHandler, JobHandlerEventType } from "./JobHandler"
import { IJobExecutorConstructor, IJobExecutor } from "./JobTypes"
import { IEnumEventRemover, JobKey, JobsMaxConcurrency, getHot, setDataOnHotDispose } from "epic-global"
import { IJob, JobStatus, JobType, IJobStatusDetail } from "epic-typedux/state/jobs"
import { BaseService, RegisterService, IServiceConstructor } from "epic-services/internal"
import { jobsSelector, jobDetailsSelector } from "epic-typedux/selectors/JobSelectors"
import { ObservableStore } from "typedux"
import { TJobMap } from "epic-typedux/state/jobs/JobTypes"
import {Map} from 'immutable'

const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


export type TJobExecutorClassMap = {[name:string]:IJobExecutorConstructor}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
	job:IJob
}


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
	
	private store:ObservableStore<any>
	
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
	private workingJobs = Map<string,IJobContainer>().asMutable()
	
	
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	dependencies(): IServiceConstructor[] {
		const
			{DatabaseClientService} = require("epic-services/DatabaseClientService") as any
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
		this.store = Container.get(ObservableStore as any) as any
		
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
		
		
		this.unsubscriber =  this.store.observe([JobKey, 'all'], this.onJobsUpdated)
		
		// Execute default jobs
		const
			allJobs = jobsSelector(getStoreState())
		
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
	onJobsUpdated = async (jobs:TJobMap) => {
		log.debug(`Checking jobs`,jobs)
		
		try {
			const
				newJobs = jobs
					.valueSeq()
					.filter(job =>
					job &&
					job.status === JobStatus.Created && !this.workingJobs.has(job.id)),
				
				details = jobDetailsSelector(this.store.getState())
			
			log.debug(`Found ${newJobs.size} new jobs, executing now`)
			
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
		const workingJob = this.workingJobs.get(job.id)
		
		if (workingJob && job.status >= JobStatus.Completed) {
			log.debug(`Removing ${job.name} (${job.id}) from working job list`)
			this.workingJobs.remove(job.id)
			
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
		if (this.workingJobs.size > JobsMaxConcurrency) {
			log.debug(`Job is pending, max concurrency reached`,job,JobsMaxConcurrency)
			pendingJobQueue.push({job,detail})
			return
		}
		
		// Create a new executor
		const
			handler = new JobHandler(this,job,detail),

			// Attach to all events
			eventRemovers:IEnumEventRemover[] = handler.onAll(this.onJobEvent)

		this.workingJobs.set(job.id, {
			eventRemovers,
			handler,
			job
		})
		
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

		const
			workingJobs = this.workingJobs,
			container = this.workingJobs.get(nameOrId) || workingJobs
				.valueSeq()
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
		
		this.workingJobs.clear()
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


