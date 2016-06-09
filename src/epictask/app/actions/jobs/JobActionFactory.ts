
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {JobKey} from "epictask/shared/Constants"

import {JobMessage} from './JobReducer'
import {JobState,IJob,IJobRequest} from './JobState'
import {JobHandler} from './JobHandler'


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

export class JobActionFactory extends ActionFactory<any,JobMessage> {

	constructor() {
		super(JobState)
	}

	leaf():string {
		return JobKey;
	}


	@Action()
	createJob(request:IJobRequest) {
	}

	@Action()
	updateJob(job:IJob) {

	}

	@Action()
	removeJob(job:IJob) {}

	@Action()
	processJob(job:IJob):Promise<IJob> {
		return (async (dispatcher,getState) => {
			const actions = this.withDispatcher(dispatcher,getState)
			const handler = new JobHandler(actions,job)

			log.info(`Starting job handler for job: (id=${job.id})`)
			await handler.execute()

		}) as any
	}
}