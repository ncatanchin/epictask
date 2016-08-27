/**
 * All the available job types
 */
export enum JobType {
	RepoSync,
	GetUserRepos,
	SyncEnabledRepos
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
 * Job Schedule
 */
export interface IJobSchedule {
	id:string
	type:JobType
	cron:string
	description?:string
	lastExecuted?:Date
	nextExecution?:Date
	
	// Actual scheduling data
	scheduler?:Later.IScheduleData
	
	// Cancel a job
	timer?:Later.ITimer
	
	
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

