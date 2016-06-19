import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {JobKey} from "../../../shared/Constants"
import {JobState} from './JobState'


export interface JobMessage extends ActionMessage<typeof JobState> {

}


export class JobReducer extends DefaultLeafReducer<any,JobMessage> {

	constructor() {
		super(JobKey,JobState)
	}


	defaultState():any {
		return new JobState()
	}
}