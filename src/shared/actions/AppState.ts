

import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'models/Toast'
import {User} from 'models/User'
import {AppStateType} from 'shared/AppStateType'
import {ISettings,Settings} from '../Settings'
import {RegisterModel} from 'shared/models/Registry'




export const AppStateRecord = Record({
	stateType: null,
	settings: Settings.toJSON(),

	monitorState: {},
	ready: false,
	user: null
})

@RegisterModel
export class AppState extends AppStateRecord {

	static fromJS(o:any) {
		return new AppState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs)
		}))
	}

	$$clazz = 'AppState'

	stateType:AppStateType
	ready:boolean
	settings:ISettings
	user:User

	messages:List<IToastMessage>
	monitorState:any
	error:Error


}
