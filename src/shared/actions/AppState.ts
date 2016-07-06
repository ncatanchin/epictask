

import {List,Record,Map} from 'immutable'

// Register the state model
import {AppKey} from '../Constants'
import {registerModel} from '../models/Registry'

import {IToastMessage} from '../models/Toast'
import {User} from 'shared/models'
import {AppStateType} from '../AppStateType'
import {ISettings,Settings} from '../Settings'

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


	dialogs: TDialogMap
	messages:List<IToastMessage>


	monitorState:any
	error:Error




}


registerModel(AppKey,AppState)