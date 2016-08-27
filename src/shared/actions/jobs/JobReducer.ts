// Register the state model
import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {JobKey} from "shared/Constants"
import {JobState} from 'shared/actions/jobs/JobState'

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

}