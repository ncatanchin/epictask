// Register the state model
import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {JobKey} from "epic-global"
import {JobState} from "../state/JobState"
import {Provided} from  "epic-common"

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