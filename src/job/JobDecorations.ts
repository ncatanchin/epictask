
import JobManager from "./JobManager"
import {Job} from "shared/actions/jobs/JobState"


/**
 * Annotation to register a job
 * on compilation
 *
 * @param target
 * @constructor
 */
export function RegisterJob(target:{new():Job}) {
	const service = Container.get(JobManager)
	service.registerJob(target.name,target)
}

