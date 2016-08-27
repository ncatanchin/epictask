

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

export class JobActionFactory extends ActionFactory<JobState,ActionMessage<JobState>> {

	constructor() {
		super(JobState)
	}

	leaf():string {
		return JobKey;
	}

	@ActionReducer()
	setJobInfo(jobInfo:IJobInfo) {
		return (jobState:JobState) => jobState.update('jobsInfo', (infoMap:Map<string,any>) => {
			if (!infoMap || !infoMap.set)
				infoMap = Map<string,any>()
			
			return !jobInfo ? infoMap : infoMap.set(jobInfo.jobId,jobInfo)
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