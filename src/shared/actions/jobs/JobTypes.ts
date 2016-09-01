/**
 * All the available job types
 */
export enum JobType {
	RepoSync,
	GetUserRepos,
	SyncEnabledRepos
}


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
	const descFn = JobDescriptions[job.type]
	assert(descFn,`Unable to find job description function for type: ${job.type}`)
	
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
	result?:any
	scheduleId?:string
	description?:string
	args?:any
	progress?:number
	message?:string
	error?:Error
	updatedAt?:Date
}

export type TJobLogLevel = 'DEBUG'|'INFO'|'WARN'|'ERROR'

export type TJobMap = {[id:string]:IJob}

export enum JobLogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR
}

export const JobLogLevelNames = [
	'DEBUG',
	'INFO',
	'WARN',
	'ERROR'
]

export interface IJobLog {
	id: string
	level:TJobLogLevel
	message:string
	error:Error
	details:any[]
	timestamp:number
	
}

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
	
	
	id:string
	
	type:JobType
	
	progress?:number
	
	/**
	 * Completion ETA in millis since EPOCH
	 */
	epochETA?:number
	status:JobStatus
	
	updatedAt:number
	createdAt:number
	
	error?:Error
	
	logs: IJobLog[]
}


export interface IJobAndStatusDetail {
	id:string
	status:JobStatus
	job:IJob
	detail:IJobStatusDetail
}