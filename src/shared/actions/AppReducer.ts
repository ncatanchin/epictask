
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "../Constants"
import {AppState} from './AppState'


/**
 * Global App State Reducer
 */
export class AppReducer extends DefaultLeafReducer<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState(o = {}):any {
		return AppState.fromJS(o)
	}
}