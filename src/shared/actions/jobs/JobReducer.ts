// Register the state model
import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {List,Record,Map} from 'immutable'
import {JobKey} from "shared/Constants"
import {JobState, IJobInfo, IJob} from 'shared/actions/jobs/JobState'

const log = getLogger(__filename)



/**
 * Reducer
 *
 * Sets all values onto the state
 */
export class JobReducer extends DefaultLeafReducer<JobState,ActionMessage<JobState>> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState(o = {}):any {
		return JobState.fromJS(o)
	}


	updateJob(state:JobState,updatedJob:IJobInfo) {
		const index = state.jobsInfo.findIndex(job => job.id === updatedJob.id)

		return state.merge({
			jobs: (index === -1) ? state.jobsInfo.push(updatedJob) :
				state.jobsInfo.set(index,updatedJob)
		})

	}


	triggerJob(state:JobState,job:IJob) {
		return state.set('pendingJobs',state.pendingJobs.push(job))
	}

	clearPendingJobs(state:JobState) {
		return state.set('pendingJobs',List())
	}


	setJobsInfo(state:JobState,jobsInfo:List<IJobInfo>) {
		return state.merge({jobsInfo})
	}

	setError(state:JobState,err:Error) {
		return state.merge({error:err})
	}
}