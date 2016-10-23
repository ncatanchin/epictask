import {JobType, IJob, IJobLogger} from "../shared/actions/jobs/JobTypes"
import {JobHandler} from "JobHandler"
import JobProgressTracker from "JobProgressTracker"


const log = getLogger(__filename)

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

/**
 * Find & load all jobs in the current tree
 */
export function loadAllExecutors() {
	log.info(`Loading Job Types`)
	
	const ctx =
		require.context('job/executors/',true)
	
	// Get the filenames
	const jobExecutorNames = ctx.keys()
	
	log.info('Loading job executors',jobExecutorNames)
	jobExecutorNames.forEach(ctx)
	
	// If HMR then accept the ctx
	if (module.hot)
		hmrSetup(ctx)
}


/**
 * Setup HMR
 * @param ctx
 */
function hmrSetup(ctx:RequireContext) {
	// TODO - unload old jobs
	module.hot.accept([ctx.id],(updated) => {
		loadAllExecutors()
	})
	
}
	