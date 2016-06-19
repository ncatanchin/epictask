

import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "../../shared/Constants"
import {AppState} from './AppState'


export class AppReducer extends DefaultLeafReducer<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState():any {
		return new AppState()
	}
}