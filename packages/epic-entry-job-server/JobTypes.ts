


import { IJob, JobType, IJobLogger } from "epic-typedux/state/jobs/JobTypes"
import { JobHandler } from "epic-entry-job-server/JobHandler"
import JobProgressTracker from "epic-entry-job-server/JobProgressTracker"
/**
 * Types Supported by the executor
 */
export interface IJobExecutorConstructor {
	new (job:IJob): IJobExecutor
	
	supportedTypes():JobType[]
}


/**
 * Executes a Job
 */
export interface IJobExecutor {
	
	
	
	/**
	 * Execute a job
	 *
	 * @param handler
	 * @param job
	 */
	execute(handler:JobHandler,logger:IJobLogger,progressTracker:JobProgressTracker,job:IJob):Promise<any>
}
