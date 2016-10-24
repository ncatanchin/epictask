
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "epic-global"
import {AppState} from '../state/AppState'
import {Provided} from  "epic-common"
/**
 * Global App State Reducer
 */
@Provided
export class AppReducer extends DefaultLeafReducer<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState(o = {}):any {
		return AppState.fromJS(o)
	}
}