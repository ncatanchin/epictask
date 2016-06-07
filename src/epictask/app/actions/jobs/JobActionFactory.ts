

import {AvailableRepoRepo, AvailableRepo} from 'shared/GitHubModels'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {JobKey} from "epictask/shared/Constants"

import {JobMessage,JobState,IJob} from './'


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
	createJob(job:IJob) {
	}

	@Action()
	updateJob(job:IJob) {
	}

	@Action()
	removeJob(job:IJob) {
	}

	@Action()
	processJob(jobFn:Function) {
		return async (dispatcher,getState) => {

		}
	}
}