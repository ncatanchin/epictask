

import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AppKey} from "shared/Constants"
import {AppState} from './AppState'
import {User} from 'shared/models/User'
import {Issue} from '../models/Issue'
import {AppStateType} from '../AppStateType'
import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {ISettings} from '../Settings'

import * as uuid from 'node-uuid'

export function makeToastMessage(opts:any) {
	return Object.assign(opts,{
		id:uuid.v4(),
		createdAt:Date.now()
	})
}

export class AppReducer extends DefaultLeafReducer<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppKey,AppState)
	}


	defaultState():any {
		return new AppState()
	}


	setUser(state:AppState,user:User) {
		state.user = user
		return state
	}

	setEditingIssue(state:AppState,issue:Issue) {
		return state.merge({editingIssue:issue})
	}

	setDialogOpen(state:AppState,name:string,open:boolean) {
		return state.merge({
			dialogs: Object.assign({},state.dialogs,{
				[name]:open
			})
		})
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
		return state.update('messages',(messages) => messages.push(message))
	}

	addErrorMessage(state:AppState,err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message
		})
		return this.addMessage(state,message)
	}

	removeMessage(state:AppState,id:string) {
		return state.merge({
			messages: state.messages.filter(msg => msg.id !== id)
		})
	}

	setMonitorState(state:AppState,monitorState:any) {
		return state.merge({monitorState})
	}

	updateSettings(state:AppState,newSettings:ISettings) {
		return state.merge({
			settings: _.merge({},state.settings,newSettings)
		})
	}
}