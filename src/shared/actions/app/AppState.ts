

import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {AppStateType} from 'shared/AppStateType'
import {ISettings} from 'shared/settings/Settings'
import {RegisterModel} from 'shared/Registry'


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
			return state.set('settings',require('shared/settings/SettingsFile').Settings.toJSON())
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
	messages:List<IToastMessage>
	monitorState:any
	error:Error


}
