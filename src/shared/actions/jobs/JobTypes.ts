/**
 * All the available job types
 */
export enum JobType {
	RepoSync,
	GetUserRepos,
	SyncEnabledRepos
}


/**
 * Job Description functions, eventually i18n if this thing takes off
 */
const JobDescriptions = {
	[JobType.GetUserRepos]: (job:IJob) => "Getting user repositories",
	[JobType.SyncEnabledRepos]: (job:IJob) => "Synchronizing activated repo activity",
	[JobType.RepoSync]: (job:IJob) => `Synchronized repo ${job.args.repo.full_name}`
}

/**
 * Get a job description
 *
 * @param job
 *
 * @return {string} describing the job
 */
export function getJobDescription(job:IJob):string {
	if (!job)
		return null
	
	const
		descFn = JobDescriptions[job.type]
	
	assert(
		descFn,
		`Unable to find job description function for type: ${job.type}`
	)
	
	return descFn(job)
}

/**
 * Job Statuses
 */
export enum JobStatus {
	Unknown = 1,
	Waiting,
	Created,
	InProgress,
	Completed,
	Failed,
	PendingCancel,
	Cancelled
}


/**
 * Cancelled Job Statuses
 * @type {JobStatus[]}
 */
export const JobCancelledStatuses = [JobStatus.PendingCancel,JobStatus.Cancelled]

/**
 * Job Schedule
 */
export interface IJobSchedule {
	id:string
	type:JobType
	name:string
	cron:string
	description?:string
	lastTimestamp?:Date
	nextTimestamp?:Date
	nextText?:string
	args?:any
	
	
}



/**
 * Standard job definition
 */
export interface IJob {
	id:string
	type:JobType
	name:string
	status:JobStatus
	logFilename:string
	logJSONFilename:string
	result?:any
	scheduleId?:string
	description?:string
	args?:any
	progress?:number
	message?:string
	error?:Error
	updatedAt?:Date
}

/**
 * Type for ref map to jobs
 */
export type TJobMap = {[id:string]:IJob}

/**
 * Job level string literals
 */
export type TJobLogLevel = 'DEBUG'|'INFO'|'WARN'|'ERROR'


/**
 * Log Level Enum
 */
export enum JobLogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR
}

/**
 * Level names constants - must adhere to {TJobLogLevel}
 */
export const JobLogLevelNames:TJobLogLevel[] = [
	'DEBUG',
	'INFO',
	'WARN',
	'ERROR'
]

export interface IErrorStackFrame {
	functionName?: string
	args?: any[]
	fileName?: string
	lineNumber?: number
	columnNumber?: number
	source?: string
}

/**
 * Log record interface
 */
export interface IJobLog {
	id: string
	level:TJobLogLevel
	message:string
	error?:Error
	errorDetails?: {
		message?:string
		frames?:IErrorStackFrame[]
		stack?:string
	}
	details?:any[]
	timestamp:number
	
}

/**
 * Shape of a job logger (probably could extend TypeLogger ILogger in the future
 */
export interface IJobLogger {
	debug(message:string,error?:Error,...details:any[])
	info(message:string,error?:Error,...details:any[])
	warn(message:string,error?:Error,...details:any[])
	error(message:string,error?:Error,...details:any[])
}

/**
 * A formally scheduled job
 */
export interface IJobStatusDetail {
	
	/**
	 * Unique ID
	 */
	id:string
	
	/**
	 * Job Type
	 */
	type:JobType
	
	/**
	 * Progress, must be >= 0 & <= 1, 0.35 = 35%
	 */
	progress?:number
	
	/**
	 * Completion ETA in millis since EPOCH
	 */
	epochETA?:number
	
	/**
	 * Millis remaining to complete job
	 */
	timeRemaining?:number
	
	/**
	 * Status
	 */
	status:JobStatus
	
	/**
	 * Updated at, last update
	 */
	updatedAt:number
	
	/**
	 * Created at timestamp
	 */
	createdAt:number
	
	/**
	 * Resulting error if status = failed
	 */
	error?:Error
	
}


export interface IJobAndStatusDetail {
	id:string
	status:JobStatus
	job:IJob
	detail:IJobStatusDetail
}