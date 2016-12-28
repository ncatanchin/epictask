import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { List, Record, Map } from "immutable"
import { Settings } from "epic-global"
import { User } from "epic-models"
import { AppStateType } from "./app/AppStateType"
import { reviveImmutable } from "epic-global/ModelUtil"
import { TrayState } from "./TrayState"


export type TWindowMap = Map<number,IWindowState>

/**
 * The underlying app state record for immutability
 *
 * @type {Immutable.Record.Class}
 */
export const AppStateRecord:Record.Class = Record({
	stateType:AppStateType.AuthLogin,
	settings: new Settings(),
	ready: false,
	tray: new TrayState(),
	user: null,
	customAccelerators: Map<string,string>(),
	messages:List<INotification>(),
	
	zoom: 1,
	windows:Map<string,IWindowState>()
})

/**
 * The global app state
 */
@ModelRegistryScope.Register
export class AppState extends AppStateRecord {

	static fromJS(o:any):AppState {
		let
			settings = o && (o.get ? o.get('settings') : o.settings)
		
		if (o) {
			const
				trayState = new TrayState(o.tray || {})
			
			o.set ? o.set('tray',trayState) : o.tray = trayState
		}
		// if (o && o.tray) {
		// 	const
		// 		tray = TrayState.fromJS(o.tray)
		//
		// 	o.set ? o.set('tray',tray) : o.tray = tray
		// }
		//
		// if (o && !o.tray)
		// 	o.tray = new TrayState()
		// else if (o && !(o.tray instanceof TrayState)) {
		// 	o.tray = new TrayState()
		// }
		let appState = reviveImmutable(
			o,
			AppState,
			['messages'],
			['windows','customAccelerators']
		)
		
		if (!settings || !(settings instanceof Settings))
			appState = appState.set('settings',new Settings(settings)) as any
				
		return appState
		
	}
	
	/**
	 * To plain JS object
	 *
	 * @returns {any}
	 */
	toJS() {
		return toPlainObject(this,excludeFilterConfig(
			...excludeFilter('ready','messages')
		))
	}
	
	stateType:AppStateType
	ready:boolean
	tray:TrayState
	settings:Settings
	user:User
	zoom:number
	messages:List<INotification>
	windows:Map<number,IWindowState>
	customAccelerators: Map<string,string>


}
