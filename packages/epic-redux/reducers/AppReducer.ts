
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "shared/Constants"
import {AppState} from './AppState'
import {Provided} from 'shared/util/ProxyProvided'
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