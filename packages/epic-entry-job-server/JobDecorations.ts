
import getJobManager from "./JobManagerService"
import {IJobExecutorConstructor} from "./JobTypes"


/**
 * Annotation to register a job
 * on compilation
 *
 * @param target
 * @constructor
 */
export function JobExecutor(target:IJobExecutorConstructor) {
	
	// Only register the job on the job server
	if (!ProcessConfig.isType(ProcessType.JobServer))
		return
	
	// Load the getJobManager function and register
	getJobManager().registerExecutor(target)
}

