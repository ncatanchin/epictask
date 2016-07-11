

import {JobState, IJobInfo, IJob} from 'shared/actions/jobs/JobState'
/**
 * Created by jglanz on 5/29/16.
 */


const log = getLogger(__filename)

// IMPORTS


import {AutoWired} from 'typescript-ioc'
import {ActionFactory,Action,ActionMessage} from 'typedux'
import {JobKey} from "shared/Constants"

import {JobHandler} from './JobHandler'
import {List} from 'immutable'

/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

@AutoWired
export class JobActionFactory extends ActionFactory<any,ActionMessage<JobState>> {

	constructor() {
		super(JobState)
	}

	leaf():string {
		return JobKey;
	}

	@Action()
	setJobsInfo(jobsInfo:List<IJobInfo>) {}


	@Action()
	cancelJob(job:IJob) {}


	@Action()
	triggerJob(job:IJob) {}

	@Action()
	clearPendingJobs() {}


}

export default JobActionFactory