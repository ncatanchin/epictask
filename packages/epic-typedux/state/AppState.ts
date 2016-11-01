

import {List,Record,Map} from 'immutable'

import {INotificationMessage} from 'epic-global'
import {User} from "epic-models"
import {AppStateType} from './app/AppStateType'
import {Settings} from "epic-global"
import {RegisterModel} from "epic-global"

import {IWindowState} from 'epic-process-manager-client/WindowTypes'
import { toPlainObject,excludeFilterConfig, excludeFilter } from "typetransform"
import { reviveImmutable } from "epic-global/ModelUtil"
import { getValue } from "epic-global/ObjectUtil"



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

	static fromJS(o:any):AppState {
		
		let appState = reviveImmutable(
			o,
			AppState,
			['messages'],
			['windows']
		)
		
		if (!(appState.settings instanceof Settings))
			appState = appState.set('settings',new Settings(getValue(() => o.settings,{}))) as any
				
		return appState
		
	}

	toJS() {
		return toPlainObject(this,excludeFilterConfig(
			...excludeFilter('ready','messages')
		))
	}
	
	stateType:AppStateType
	ready:boolean
	settings:Settings
	user:User
	messages:List<INotificationMessage>
	windows:Map<string,IWindowState>


}
