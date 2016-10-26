import {JobType, IJob, IJobLogger} from "epic-typedux"
import {JobHandler} from "./JobHandler"
import JobProgressTracker from "./JobProgressTracker"


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
	
	// const ctx =
	// 	require.context('epic-entry-job-server/executors/',true)
	//
	// Get the filenames
	
	const
		executors = require('./executors'),
	
		jobExecutorNames = Object
			.keys(executors)
			.filter(key => key.endsWith('Executor'))
	
	log.info('Loading job executors',jobExecutorNames)
	
	// jobExecutorNames.forEach(ctx)
	//
	// // If HMR then accept the ctx
	// if (module.hot)
	// 	hmrSetup(ctx)
}

if (module.hot)
	module.hot.accept(['./executors'],() => loadAllExecutors)

