// Register the state model
import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {JobKey} from "shared/Constants"
import {JobState} from 'shared/actions/jobs/JobState'
import {Provided} from 'shared/util/ProxyProvided'

const log = getLogger(__filename)



/**
 * Reducer
 *
 * Sets all values onto the state
 */
@Provided
export class JobReducer extends DefaultLeafReducer<JobState,ActionMessage<JobState>> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState(o = {}):any {
		return JobState.fromJS(o)
	}

}