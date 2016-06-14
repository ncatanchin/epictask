

/**
 * Authentication State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {ToastMessageType, IToastMessage,IToastMessageAction} from 'shared/models/Toast'
import {User} from 'shared/models'
import {AppStateType} from 'shared/AppStateType'
import {ISettings,Settings} from 'shared/Settings'
import * as uuid from 'node-uuid'

/**
 * Enumeration describing app status type
 */
export enum StatusType {
	Ready,
	Loading
}

/**
 * Simple status management for the app overall
 */
export interface IStatus {
	type:StatusType
	message?:string
}



export function makeToastMessage(opts:any) {
	return Object.assign(opts,{
		id:uuid.v4(),
		createdAt:Date.now()
	})
}

export interface IUIState {
	dialogs: {[name:string]:boolean}
}

@RecordModel()
export class AppStateModel {

	@RecordProperty()
	stateType:AppStateType

	@RecordProperty()
	theme:any

	@RecordProperty()
	status:IStatus

	@RecordProperty()
	settings:ISettings

	@RecordProperty()
	messages:IToastMessage[]

	@RecordProperty()
	monitorState:any

	@RecordProperty()
	user:User

	@RecordProperty()
	ui:IUIState

	@RecordProperty()
	error:Error

	setUser(user:User) {
		this.user = user
		return this
	}


	setDialogOpen(name:string,open:boolean) {
		this.ui = _.merge({},this.ui,{
			dialogs:{
				[name]:open
			}
		})

		return this
	}
	/**
	 * Set app state
	 *
	 * @returns {AuthStateModel}
	 * @param newStateType
	 */
	setStateType(newStateType:AppStateType) {

		this.stateType = newStateType
		return this
	}

	setTheme(theme:any) {
		this.theme = theme
		return this
	}


	setError(err:Error) {
		this.error = err
		return this.addErrorMessage(err)
	}

	addMessage(message:IToastMessage) {
		this.messages = [...this.messages,message]
		return this
	}

	addErrorMessage(err:Error) {
		return this.addMessage(makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message
		}))
	}

	removeMessage(id:string) {
		this.messages = this.messages.filter(msg => msg.id !== id)
		return this
	}

	setMonitorState(monitorState:any) {
		this.monitorState = monitorState
		return this
	}

}

const AppStateDefaults = {
	stateType: null,
	messages: [],
	ui: {
		dialogs: {}
	},
	monitorState: {},
	settings: Settings.toJSON()
}

export const AppState = makeRecord(AppStateModel,AppStateDefaults)
export type TAppState = typeof AppState