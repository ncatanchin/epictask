

import {List,Record,Map} from 'immutable'

import {INotificationMessage} from 'epic-global'
import {User} from "epic-models"
import {AppStateType} from './app/AppStateType'
import {ISettings} from "epic-common"
import {RegisterModel} from "epic-global"


/**
 * The underlying app state record for immutability
 *
 * @type {Immutable.Record.Class}
 */
export const AppStateRecord:Record.Class = Record({
	stateType: null,
	settings: null,
	monitorState: {},
	ready: false,
	user: null
})


/**
 * The global app state
 */
@RegisterModel
export class AppState extends AppStateRecord {

	static fromJS(o:any) {
		const checkSettings = (state) => {
			return state.set('settings',require('epic-common').Settings.toJSON())
		}
		
		if (o && o instanceof AppState) {
			o = checkSettings(o)
			return o
		}
		return checkSettings(new AppState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs)
		})))
		
	}

	stateType:AppStateType
	ready:boolean
	settings:ISettings
	user:User
	messages:List<INotificationMessage>
	monitorState:any
	error:Error


}
