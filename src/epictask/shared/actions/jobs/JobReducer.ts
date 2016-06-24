import {DefaultLeafReducer} from 'typedux'
import {JobKey} from "shared/Constants"
import {JobMessage,JobState} from './JobState'


export class JobReducer extends DefaultLeafReducer<any,JobMessage> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState():any {
		return new JobState()
	}
}