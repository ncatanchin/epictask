

import {List,Record,Map} from 'immutable'

import {INotificationMessage} from 'epic-global'
import {User} from "epic-models"
import {AppStateType} from './app/AppStateType'
import {ISettings} from "epic-global"
import {RegisterModel} from "epic-global"

import {IWindowState} from 'epic-process-manager-client'


export type TWindowMap = Map<string,IWindowState>

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
	user: null,
	windows:Map<string,IWindowState>()
})


/**
 * Patch the settings on the state
 *
 * @param state
 *
 * @returns {AppState|Map<string, ISettings>}
 */
function updateSettings(state:AppState):AppState {
	return !ProcessConfig.isMain() ?
			state:
			state.set(
				'settings',
				require("epic-global/settings/SettingsFile").Settings.toJSON()) as AppState
	
}

/**
 * The global app state
 */
@RegisterModel
export class AppState extends AppStateRecord {

	static fromJS(o:any) {
		
		
		if (o && o instanceof AppState) {
			return updateSettings(o)
		}
		
		return updateSettings(new AppState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
			windows: Map(o.windows)
		})))
		
	}

	stateType:AppStateType
	ready:boolean
	settings:ISettings
	user:User
	messages:List<INotificationMessage>
	monitorState:any
	error:Error
	windows:Map<string,IWindowState>


}
