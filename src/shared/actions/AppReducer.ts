
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "../Constants"
import {AppState} from './AppState'

import * as uuid from 'node-uuid'


export class AppReducer extends DefaultLeafReducer<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState(o = {}):any {
		return AppState.fromJS(o)
	}


}