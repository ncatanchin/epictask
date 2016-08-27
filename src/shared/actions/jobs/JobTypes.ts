/**
 * All the available job types
 */
export enum JobType {
	RepoSync,
	GetUserRepos,
	SyncAllRepos
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
	Failed
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
}

/**
 * Standard job definition
 */
export interface IJob {
	id:string
	type:JobType
	name:string
	status:JobStatus
	scheduleId?:string
	description?:string
	args?:any
	progress?:number
	message?:string
	error?:Error
	updatedAt?:Date
}

