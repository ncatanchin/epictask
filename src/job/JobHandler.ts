
import * as uuid from 'node-uuid'
import {JobManagerService} from "job/JobManagerService"
import {EnumEventEmitter} from 'shared/util/EnumEventEmitter'
import {JobType, JobStatus, IJob, JobCancelledStatuses} from "shared/actions/jobs/JobTypes"
import {IJobStatusDetail, JobLogLevel, IJobLogger, JobLogLevelNames} from 'shared/actions/jobs/JobState'
import {IJobExecutor} from "job/JobExecutors"
import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"

const log = getLogger(__filename)


export enum JobHandlerEventType {
	Log = 1,
	Started,
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

	private killed = false
	private started = false
	private executor:IJobExecutor
	private logger:IJobLogger
	private actions:JobActionFactory
	
	public detail:IJobStatusDetail
	

	constructor(public service:JobManagerService,public job:IJob) {
		super(JobHandlerEventType)
		
		
		this.actions = Container.get(JobActionFactory)
		
		this.detail = this.actions.state.getDetail(this.job.id)
		this.executor = service.newExecutor(job)
		this.logger = JobLogLevelNames.reduce((logger,level) => {
			logger[level.toLowerCase()] = (message:string,error:Error = null,...details:any[]) => {
				this.log(JobLogLevel[level],message,error,...details)
			}
			return logger
		},{}) as IJobLogger
	}

	/**
	 * When the internal state
	 * is updated
	 */
	private fireEvent(event:JobHandlerEventType) {
		this.emit(event,this,this.job,this.detail)
	}
	
	/**
	 * Has the job been cancelled
	 *
	 * @returns {any|IJob}
	 */
	isCancelled() {
		const stateJob = this.actions
			.state
			.all
			.valueSeq()
			.find(job => job.id === this.job.id)
		
		
		return JobCancelledStatuses.includes(this.job.status) ||
			(stateJob && JobCancelledStatuses.includes(stateJob.status))
			
	}

	/**
	 * Update job status
	 *
	 * @param level
	 * @param message
	 * @param details
	 * @param error
	 */
	log(level:JobLogLevel,message:string,error:Error,...details:any[]) {
		
		// Log locally
		log[JobLogLevel[level].toLowerCase()](
			`Job > ${this.job.name} > ${this.job.id}`,
			message,
			error,
			...details
		)
		
		// Then log to actions to update everywhere
		this.actions.log(this.job.id,uuid.v4(),level,message,Date.now(), error,...details)
		
		// Finally fire changed event
		this.fireEvent(JobHandlerEventType.Log)
	}


	/**
	 * Start the handler
	 *
	 * for a repeating scheduled job the
	 * same handler is used.  `this.info`
	 * is reset after each execution
	 */
	start() {
		this.fireEvent(JobHandlerEventType.Started)
	}



	/**
	 * Update the job status
	 *
	 * @param status
	 * @param progress
	 * @param error
	 * @returns {IJob}
	 */
	async setStatus(status:JobStatus, error:Error = null, progress = -1) {
		assign(this.job, {status})
		assign(this.detail, {
			status,
			progress,
			error
		})
		
		this.actions.update(this.job,this.detail)
		this.fireEvent(JobHandlerEventType.Changed)
	}

	/**
	 * Execute and return final job instance
	 *
	 * @returns {IJob}
	 */
	async execute() {
		
		const {job, started, killed} = this
		assert(!started && !killed && job.status === JobStatus.Created,
			'Job Status must be CREATED and the handler can not be started or killed in order to execute')
		
		this.started = true
		
		try {
			// First mark in progress
			await this.setStatus(JobStatus.InProgress)
			
			// Get the result
			job.result = await this.executor.execute(this,this.logger,job)
			
			await this.setStatus(JobStatus.Completed)
		} catch (err) {
			log.error(`Job failed: ${job.name}(${job.id}) - ${job.description}`, err)
			
			await this.setStatus(JobStatus.Failed, err)
		}
		
	}
}
