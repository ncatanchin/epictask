import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { List, Record, Map } from "immutable"
import { Settings, RegisterModel } from "epic-global"
import { User } from "epic-models"
import { AppStateType } from "./app/AppStateType"
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
	messages:List<INotification>(),
	windows:Map<string,IWindowState>()
})

/**
 * The global app state
 */
@RegisterModel
export class AppState extends AppStateRecord {

	static fromJS(o:any):AppState {
		let
			settings = o && (o.get ? o.get('settings') : o.settings)
		
		let appState = reviveImmutable(
			o,
			AppState,
			['messages'],
			['windows']
		)
		
		if (!settings || !(settings instanceof Settings))
			appState = appState.set('settings',new Settings(settings)) as any
				
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
	messages:List<INotification>
	windows:Map<string,IWindowState>


}
