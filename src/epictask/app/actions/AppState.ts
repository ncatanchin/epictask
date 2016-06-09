

/**
 * Authentication State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {AppStateType} from '../../shared/AppStateType'
import {Settings} from '../../shared'
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
	type:StatusType,
	message?:string
}


export enum ToastMessageType {
	Debug = 1,
	Info,
	Error
}

export interface IToastMessageAction {
	label:string,
	execute:Function
}

export interface IToastMessage {
	id:string,
	createdAt:number,
	type:ToastMessageType,
	content:any,
	actions?:IToastMessageAction[]
}

export function makeToastMessage(opts:any) {
	return Object.assign(opts,{
		id:uuid.v4(),
		createdAt:Date.now()
	})
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
	messages:IToastMessage[]

	@RecordProperty()
	monitorState:any

	@RecordProperty()
	error:Error


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
	stateType: ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin),
	messages: [],
	monitorState: {}
}

export const AppState = makeRecord(AppStateModel,AppStateDefaults)
export type TAppState = typeof AppState