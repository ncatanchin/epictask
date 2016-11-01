
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "epic-global/Constants"
import {Provided} from  "epic-global/ProxyProvided"
import {AppState} from '../state/AppState'

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