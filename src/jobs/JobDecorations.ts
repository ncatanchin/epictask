


import {Container} from "typescript-ioc"
import JobService from "jobs/JobService"
import {Job} from "shared/actions/jobs/JobState"


/**
 * Annotation to register a job
 * on compilation
 *
 * @param target
 * @constructor
 */
export function RegisterJob(target:{new():Job}) {
	const service = Container.get(JobService)
	service.registerJob(target.name,target)
}

