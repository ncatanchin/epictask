import {ObservableStore} from 'typedux'
import {Map} from 'immutable'

import DefaultJobSchedules from './JobSchedules'
import {JobActionFactory} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {JobHandler, JobHandlerEventType} from 'job/JobHandler'
import * as assert from 'assert'
import {Toaster} from 'shared/Toaster'
import {IEnumEventRemover} from 'shared/util/EnumEventEmitter'
import {IJob, JobStatus, JobType, IJobSchedule} from 'shared/actions/jobs/JobTypes'
import {IJobExecutorConstructor, loadAllExecutors, IJobExecutor} from "job/JobExecutors"
import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {AppStoreService} from "shared/services/AppStoreService"
import {DatabaseClientService} from "shared/services/DatabaseClientService"
import {IJobStatusDetail} from "shared/actions/jobs/JobState"

const log = getLogger(__filename)

export type TScheduledJobMap = {[name:string]:IJob}

export type TJobExecutorClassMap = {[name:string]:IJobExecutorConstructor}

export interface IJobContainer {
	eventRemovers:IEnumEventRemover[]
	handler:JobHandler
	job:IJob
}

export type TJobMap= {[name:string]:IJobContainer}


// Singleton ref
let jobManager:JobManagerService


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
	 * @type {TJobMap}
	 */
	private workingJobs:TJobMap = {}
	
	/**
	 * All Scheduler config
	 */
	private scheduler:Later.IScheduleData
	
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	
	private store:ObservableStore<any>
	private jobActions:JobActionFactory
	private repoActions:RepoActionFactory
	private toaster:Toaster
	
	private schedules:{[id:string]:IJobSchedule} = {}
	
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService,AppStoreService]
	}
	
	constructor() {
		super()
		
		assert(!jobManager,`Job Manager can only be instantiated once`)
	}
	
	
	/**
	 * Load a schedule and configure it
	 * @param schedule
	 */
	private loadSchedule = (schedule) => {
		this.schedules[schedule.id] = schedule
		
		// TODO: schedule executions
	}
	
	/**
	 * Load and configure job schedules
	 */
	private loadSchedules() {
		DefaultJobSchedules.forEach(this.loadSchedule)
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
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		

		// Watch for job updates
		log.info('Subscribe for state updates')
		this.unsubscriber = this.store.observe([this.jobActions.leaf(), 'all'], this.onJobsUpdated)
		
		log.info("Load executors")
		loadAllExecutors()
		
		log.info('Load schedules')
		this.loadSchedules()
		
		log.info('Ready to work some jobs...')
		return super.start()
	}
	
	
	/**
	 * Check for new jobs, cancelled jobs, etc
	 *
	 * @param jobs
	 */
	onJobsUpdated = (jobs:Map<string,IJob>) => {
		
		const newJobs = jobs
			.valueSeq()
			.filter(job =>
				job.status === JobStatus.Created &&
				!this.workingJobs[job.id])
			.toArray()
			
		
		log.debug(`Found ${newJobs.length} new jobs, executing now`)
		
		newJobs.forEach(this.execute)
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
		
	}
	
	/**
	 * Execute a job
	 *
	 * @param job
	 * @returns {JobHandler}
	 */
	execute = (job:IJob) => {
		if (this.killed) return
		
		
		// Create a new executor
		const
			handler = new JobHandler(this,job),

			// Attach to all events
			eventRemovers:IEnumEventRemover[] = handler.onAll(this.onJobEvent)

		this.workingJobs[job.id] = {
			eventRemovers,
			handler,
			job
		}
		
		handler.start()
		
		return handler

	}

	
	/**
	 * Find an existing job that matches the
	 * current job request
	 *
	 * @returns {Job}
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
	
	
	
	/**
	 * Reset/Init the job info and schedule
	 */
	reset() {
		// if (this.killed) return
		//
		// this.info = new JobStatusDetails()
		// this.info.id = uuid.v4()
		// this.info.jobId = this.job.id
		// this.info.description = this.job.description
		//
		// if (this.scheduler)
		// 	this.schedule()
		// else
		// 	this.execute()
	}
	
	/**
	 * Schedule the job for later execution
	 */
	schedule() {
	// 	if (!this.timer) {
	// 		assert(this.scheduler,'Schedule must be set in order to schedule')
	//
	// 		const executor = () => this.execute()
	//
	// 		this.timer = (this.job.repeat) ?
	// 			later.setInterval(executor, this.scheduler) :
	// 			later.setTimeout(executor, this.scheduler)
	//
	// 	}
	//
	// 	const nextOccurrence =  later.schedule(this.scheduler).next(1)
	//
	// 	this.info.nextScheduledTime = Array.isArray(nextOccurrence) ? nextOccurrence[0] : nextOccurrence
	//
	// 	const nextText = moment(nextOccurrence).fromNow()
	// 	log.info(`Scheduled Job ${this.job.name} occurs next ${nextText}`)
	//
	}
}


/**
 * Get the JobManager singleton
 *
 * @return {JobManager}
 */
export function getJobManager() {
	return JobManagerService.getInstance()
}

Container.bind(JobManagerService).provider({get: getJobManager})

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


