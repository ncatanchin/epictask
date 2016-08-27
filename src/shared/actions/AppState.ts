

import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {AppStateType} from 'shared/AppStateType'
import {ISettings} from 'shared/Settings'
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
		if (o && o instanceof AppState)
			return o
		
		return new AppState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs)
		}))
		
	}

	stateType:AppStateType
	ready:boolean
	settings:ISettings
	user:User
	messages:List<IToastMessage>
	monitorState:any
	error:Error


}
