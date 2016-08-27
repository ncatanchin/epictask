import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {AppStateType} from 'shared/AppStateType'
import {RegisterModel} from 'shared/Registry'
import {State} from "typedux"


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



export const UIStateRecord = Record({


	dialogs: Map<string,boolean>(),

	messages: List<IToastMessage>(),
	ready: false,

	repoPanelOpen: true,

	user: null
})

@RegisterModel
export class UIState extends UIStateRecord implements State {

	static fromJS(o:any = {}) {
		if (o && o instanceof UIState)
			return o
		
		return new UIState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
		}))
	}

	$$clazz = 'UIState'


	ready:boolean
	user:User
	dialogs:TDialogMap
	messages:List<IToastMessage>

	repoPanelOpen:boolean


}