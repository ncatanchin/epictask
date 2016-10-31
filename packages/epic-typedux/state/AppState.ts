

import {List,Record,Map} from 'immutable'

import {INotificationMessage} from 'epic-global'
import {User} from "epic-models"
import {AppStateType} from './app/AppStateType'
import {Settings} from "epic-global"
import {RegisterModel} from "epic-global"

import {IWindowState} from 'epic-process-manager-client/WindowTypes'


export type TWindowMap = Map<string,IWindowState>

/**
 * The underlying app state record for immutability
 *
 * @type {Immutable.Record.Class}
 */
export const AppStateRecord:Record.Class = Record({
	stateType:AppStateType.AuthLogin,
	settings: new Settings(),
	ready: false,
	user: null,
	messages:List<INotificationMessage>(),
	windows:Map<string,IWindowState>()
})

/**
 * The global app state
 */
@RegisterModel
export class AppState extends AppStateRecord {

	static fromJS(o:any) {
		
		return o && o instanceof AppState ? o : new AppState(Object.assign({},o,{
			messages: List(o.messages),
			settings: Map(o.settings),
			windows: Map(o.windows)
		}))
		
	}

	toJS() {
		return Object.assign(_.pick(this,'stateType','user'),{
			windows: this.windows.toJS()
		})
	}
	
	stateType:AppStateType
	ready:boolean
	settings:Settings
	user:User
	messages:List<INotificationMessage>
	windows:Map<string,IWindowState>


}
