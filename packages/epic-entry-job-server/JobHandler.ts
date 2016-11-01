import * as uuid from "node-uuid"
import { JobManagerService } from "./JobManagerService"
import { EnumEventEmitter } from "epic-global/EnumEventEmitter"
import {
	JobStatus,
	IJob,
	JobCancelledStatuses,
	IJobLogger,
	IJobStatusDetail,
	JobLogLevelNames,
	JobLogLevel,
	JobActionFactory,
	getJobActions
} from "epic-typedux"
import { IJobExecutor } from "./JobTypes"
import JobProgressTracker from "./JobProgressTracker"
import * as fs from "fs"


const
	log = getLogger(__filename)


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
	private logFile
	private logJSONFile
	
	
	/**
	 * The progress tracker for the job, used to calculate progress, etc
	 *
	 * @type {JobProgressTracker}
	 */
	private progressTracker:JobProgressTracker

	constructor(public service:JobManagerService,public job:IJob,private detail:IJobStatusDetail) {
		super(JobHandlerEventType)
		
		this.actions = getJobActions()
		this.progressTracker = new JobProgressTracker(this)
		
		this.executor = service.newExecutor(job)
		
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
		return JobCancelledStatuses.includes(this.job.status)
	}

	/**
	 * Update job status
	 *
	 * @param level
	 * @param message
	 * @param logDetails
	 * @param error
	 */
	log(level:JobLogLevel,message:string,error:Error,...logDetails:any[]) {
		
		// Log locally
		log[JobLogLevel[level].toLowerCase() === 'error' ? 'error' : 'debug'](
			`Job > ${this.job.name} > ${this.job.id}`,
			message,
			error,
			...logDetails
		)
		
		// Then log to actions to update everywhere
		try {
			let msg = `[${JobLogLevel[level]}] \t> ${this.job.name} \t > ${message}\n`
			logDetails.forEach((logDetail,index) => {
				msg += `\t\tDetail[${index}] >> ${logDetail}\n`
			})
			if (error) {
				msg += `\t\tError ${error.message} > ${error.stack}\n`
			}
			
			fs.writeSync(this.logFile,msg)
			fs.writeSync(this.logJSONFile,JSON.stringify({
				level: JobLogLevel[level],
				timestamp: Date.now(),
				message,
					logDetails,
				error,
				id: uuid.v4()
			}) + '\n')
			//JobDAO.logRecord(this.job.id,uuid.v4(),level,message,Date.now(), error,...details)
		} catch (err) {
			log.error(`Failed to log to job file`,err)
		}
		
		
		// Finally fire changed event
		this.fireEvent(JobHandlerEventType.Log)
	}
	
	/**
	 * Updates the progress and completion estimates
	 *
	 * @param progress
	 * @param timeRemaining
	 * @param epochETA
	 */
	
	setProgress = _.debounce((progress:number,timeRemaining:number,epochETA:number) => {
		try {
			assign(this.detail, {
				progress,
				timeRemaining,
				epochETA
			})
			
			this.actions.update(this.job, this.detail)
		} catch (err) {
			log.error(`Progress update failed`,err)
		}
	},500)
	
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
	 * @param error
	 * @returns {IJob}
	 */
	async setStatus(status:JobStatus, error:Error = null) {
		try {
			if (status < this.job.status) {
				log.info(`Job status value, can not decrement`)
				return
			}
			
			assign(this.job, { status })
			assign(this.detail, {
				status,
				error
			})
			
			
			this.actions.update(this.job, this.detail)
			this.fireEvent(JobHandlerEventType.Changed)
		} catch (err) {
			log.error('Status update failed',err)
		}
	}

	/**
	 * Execute and return final job instance
	 *
	 * @returns {IJob}
	 */
	
	 async execute() {
		
		const
			{job, started, killed} = this
		
		assert(!started && !killed && job.status === JobStatus.Created,
			'Job Status must be CREATED and the handler can not be started or killed in order to execute')
		
		
		try {
			
			this.logFile = fs.openSync(job.logFilename, 'w')
			this.logJSONFile = fs.openSync(job.logJSONFilename, 'w')
			
			log.info(`Log file @`, job.logFilename)
			log.info(`Log JSON file @`, job.logJSONFilename)
			
			// Make the logger
			this.logger = JobLogLevelNames.reduce((logger, level) => {
				logger[ level.toLowerCase() ] = (message:string, error:Error = null, ...details:any[]) => {
					this.log(JobLogLevel[ level ], message, error, ...details)
				}
				return logger
			}, {}) as IJobLogger
			
			this.started = true
			
			// First mark in progress
			await this.setStatus(JobStatus.InProgress)
			
			// Get the result
			job.result = await this.executor.execute(this, this.logger, this.progressTracker, job)
			
			
			await this.setStatus(JobStatus.Completed)
		} catch (err) {
			log.error(`Job failed: ${job.name}(${job.id}) - ${job.description}`, err)
			
			// if (this.job.)
			await this.setStatus(JobStatus.Failed, err)
		} finally {
			try {
				fs.closeSync(this.logFile)
			} catch (err) {
				log.error(`Failed to close file`)
			}
			
			try {
				fs.closeSync(this.logJSONFile)
			} catch (err) {
				log.error(`Failed to close file`)
			}
		}
	
	
		
		
	}
}
