

import {List,Record,Map} from 'immutable'

// Register the state model
import {AppKey} from 'shared/Constants'
import {registerModel} from 'shared/models/Registry'

import {IToastMessage} from 'shared/models/Toast'
import {User,Issue} from 'shared/models'
import {AppStateType} from 'shared/AppStateType'
import {ISettings,Settings} from 'shared/Settings'

import {getTheme} from 'shared/themes/ThemeManager'

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

export type TDialogMap = Map<string,boolean>




export const AppStateRecord = Record({
	stateType: null,
	status: null,
	settings: Settings.toJSON(),

	dialogs: Map<string,boolean>(),
	messages: List<IToastMessage>(),
	editingIssue: null,
	monitorState: {},
	ready: false,
	user: null
})

export class AppState extends AppStateRecord {

	static fromJS(o:any) {
		return new AppState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs)
		}))
	}

	stateType:AppStateType
	ready:boolean
	status:IStatus
	settings:ISettings
	user:User

	editingIssue:Issue
	dialogs: TDialogMap
	messages:List<IToastMessage>


	monitorState:any
	error:Error




}


registerModel(AppKey,AppState)