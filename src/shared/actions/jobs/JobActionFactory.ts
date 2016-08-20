

import {AutoWired} from 'typescript-ioc'
import {ActionFactory, Action, ActionMessage, ActionReducer} from 'typedux'
import {Map} from 'immutable'


// IMPORTS
import {JobState, IJobInfo, IJob} from 'shared/actions/jobs/JobState'
import {JobKey} from "shared/Constants"

const log = getLogger(__filename)

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

	@ActionReducer()
	setJobInfo(jobInfo:IJobInfo) {
		return (jobState:JobState) => jobState.update('info', (infoMap:Map<string,any>) => {
			return infoMap.set(jobInfo.jobId,jobInfo)
		})
	}


	@Action()
	cancelJob(job:IJob) {}


	@Action()
	triggerJob(job:IJob) {}

	@Action()
	clearPendingJobs() {}


}

export default JobActionFactory