
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

export class AppReducer extends DefaultLeafReducer<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState():any {
		return new AppState()
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


	setDialogOpen(state:AppState,name:string,open:boolean) {
		return state.set(
			'dialogs',
			state.dialogs.set(name,open)
		)
	}

	setStateType(state:AppState,stateType:AppStateType) {
		return state.merge({stateType})
	}

	setTheme(state:AppState,theme:any) {
		return state.merge({theme})
	}


	setError(state:AppState,err:Error) {
		return this.addErrorMessage(state,err)
	}

	addMessage(state:AppState,message:IToastMessage) {
		const messageList = _.uniqueListBy(state.messages.push(message),'id')
		return state.set('messages',messageList)
	}

	addErrorMessage(state:AppState,err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message || err.toString(),
			stack: err.stack
		})
		return this.addMessage(state,message)
	}

	removeMessage(state:AppState,id:string) {
		return state.set(
			'messages',
			state.messages.filter(msg => msg.id !== id)
		)
	}

	clearMessages(state:AppState) {
		return state.set('messages',List())
	}

	setMonitorState(state:AppState,monitorState:any) {
		return state.merge({monitorState})
	}

	updateSettings(state:AppState,newSettings:ISettings) {
		return state.set('settings', newSettings)
	}
}