
import {List} from 'immutable'
import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "../Constants"
import {AppState} from './AppState'
import {User} from '../models/User'
import {AppStateType} from '../AppStateType'
import {ToastMessageType, IToastMessage} from '../models/Toast'
import {ISettings} from '../Settings'

import * as uuid from 'node-uuid'

export function makeToastMessage(opts:any) {
	return Object.assign(opts,{
		id:uuid.v4(),
		createdAt:Date.now(),
		content: opts.content || 'No content provided - DANGER will robinson'
	})
}

export class AppReducer extends DefaultLeafReducer<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState(o = {}):any {
		return AppState.fromJS(o)
	}


	/**
	 * Set the user
	 *
	 * @param state
	 * @param user
	 * @returns {Map<string, User>}
	 */
	setUser(state:AppState,user:User) {
		return state.set('user',user)
	}


	/**
	 *
	 * @param state
	 * @param ready
	 * @returns {Map<string, V>}
	 */
	setReady(state:AppState,ready:boolean) {
		return state.merge({ready})
	}



	setStateType(state:AppState,stateType:AppStateType) {
		return state.merge({stateType})
	}




	setMonitorState(state:AppState,monitorState:any) {
		return state.merge({monitorState})
	}

	updateSettings(state:AppState,newSettings:ISettings) {
		return state.set('settings', newSettings)
	}
}