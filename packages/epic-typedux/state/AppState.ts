import { toPlainObject, excludeFilterConfig, excludeFilter, fromPlainObject } from "typetransform"
import { List, Record, Map } from "immutable"
import { Settings } from "epic-global"
import { User } from "epic-models"
import { AppStateType } from "./app/AppStateType"
import { reviveImmutable } from "epic-util"
import { TrayState } from "./TrayState"
import {PluginState} from "./PluginState"
import { getValue, isFunction } from "typeguard"

const log = getLogger(__filename)

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
	plugins: Map<string,PluginState>(),
	user: null,
	customAccelerators: Map<string,string>(),
	messages:List<INotification>(),
	
	zoom: 1,
	windows:Map<string,IWindowState>()
})

/**
 * The global app state
 */
@Scopes.Models.Register
export class AppState extends AppStateRecord {
	
	/**
	 * Create AppState from plain JS
	 *
	 * @param o
	 * @returns {AppState}
	 */
	static fromJS(o:any):AppState {
		
		
		const
			getProp = name => o && (o.get ? o.get(name) : o[name])
		
		let
			settings = getProp('settings'),
			srcPlugins = getProp('plugins') || {}
			
		if (srcPlugins.toJS) {
			srcPlugins = srcPlugins.toJS()
		}
		
		if (o) {
			const
				trayState = new TrayState(o.tray || {})
			
			o.set ? o.set('tray',trayState) : o.tray = trayState
		}
		
		let appState = reviveImmutable(
			o,
			AppState,
			['messages'],
			['windows','customAccelerators','plugins']
		)
		
		if (!settings || !(settings instanceof Settings))
			appState = appState.set('settings',new Settings(settings)) as any
		
		let
			plugins = Map<string,PluginState>()
		
		Object
			.values(srcPlugins)
			.forEach((plugin:any) => {
				if (!(plugin instanceof PluginState)) {
					plugin = new PluginState(fromPlainObject(Map.isMap(plugin) ? plugin.toJS() : plugin))
				}
				
				const
					name = getValue(() => plugin.config.name)
				
				if (!name) {
					log.warn(`Skipping plugin, no name: ${JSON.stringify(plugin.toJS(),null,4)}`)
					return
				}
				
				plugins = plugins.set(name,plugin)
			})
		
		appState = appState.set('plugins',plugins) as AppState
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
	plugins: Map<string,PluginState>
	settings:Settings
	user:User
	zoom:number
	messages:List<INotification>
	windows:Map<number,IWindowState>
	customAccelerators: Map<string,string>


}

declare global {
	interface IAppState extends AppState {}
}