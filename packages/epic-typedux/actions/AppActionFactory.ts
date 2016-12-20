import { ActionFactory, ActionReducer, ActionMessage } from "typedux"
import {
	Events, AppKey, Provided, cloneObjectShallow,
	shortId
} from "epic-global"

import { User } from "epic-models"
import { AppState } from "../state/AppState"
import { AppStateType } from "../state/app/AppStateType"
import { Settings } from "epic-global/settings/Settings"
import { getWindowManagerClient } from "epic-process-manager-client"


const
	log = getLogger(__filename)


declare global {
	
	interface IAppActionFactory extends AppActionFactory {
	}
	
	/**
	 * Add the AppActions Injector
	 */
	namespace Inject {
		namespace Service {
			const AppActions: IInjector<IAppActionFactory>
		}
	}
	
	/**
	 * Add the service to the registry
	 */
	namespace Registry {
		namespace Service {
			let AppActions:IAppActionFactory
		}
	}
}

/**
 * Core EpicTask actions
 */

@Provided
@ServiceRegistryScope.Register
export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> {
	
	static ServiceName = "AppActions"
	
	static leaf = AppKey
	
	constructor() {
		super(AppState)
	}
	
	/**
	 * Leaf name
	 * @returns {string}
	 */
	leaf():string {
		return AppKey;
	}
	
	
	/**
	 * Set an accelerator override
	 *
	 * @param commandId
	 * @param accelerator
	 * @returns {(state:AppState)=>Map<string, Map<string, string>>}
	 */
	@ActionReducer()
	setCustomAccelerator(commandId:string,accelerator:string) {
		return (state:AppState) =>
			state.set('customAccelerators',state.customAccelerators.set(commandId,accelerator))
	}
	
	
	/**
	 * Create a notification object
	 *
	 * @param opts
	 * @returns {{}&U&{id: string, createdAt: number, floatVisible: boolean, content: string}}
	 */
	private makeNotification(opts:any) {
		return Object.assign({},opts,{
			id: shortId(),
			createdAt:Date.now(),
			floatVisible: true,
			content: opts.content || 'No content provided - DANGER will robinson'
		})
	}
	
	
	
	
	
	/**
	 * Add notification
	 *
	 * @param message
	 * @returns {(state:UIState)=>Map<string, V>}
	 */
	@ActionReducer()
	addNotification(message:INotification) {
		return (state:AppState) => {
			let
				{messages} = state
			
			const
				msgIndex = messages
					.findIndex(item => _.toJS(item).id === message.id)
			
			messages = (msgIndex > -1) ?
				messages.set(msgIndex,_.clone(message)) :
				messages.push(_.clone(message))
			
			if (messages.size > 5)
				messages = messages.splice(0, messages.size - 5) as any
			
			return state.set('messages',messages)
			
		}
	}
	
	notifyError(err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = this.makeNotification({
			type: NotificationType.Error,
			content: err.message || err.toString(),
			stack: err.stack
		})
		return this.addNotification(message)
	}
	
	
	/**
	 * Update a notification
	 *
	 * @param message
	 */
	updateNotification(message:INotification) {
		return this.addNotification(message)
	}
	
	/**
	 * Remove a notification
	 *
	 * @param id
	 */
	@ActionReducer()
	removeNotification(id:string) {
		return (state:AppState) => state.set(
			'messages',
			state.messages.filter(msg => msg.id !== id)
		)
	}
	
	/**
	 * Remove all notifications
	 */
	@ActionReducer()
	clearNotifications() {
		return (state:AppState) => state.set(
			'messages',
			state.messages.clear()
		)
	}
	
	/**
	 *
	 * @param ready
	 * @returns {Map<string, V>}
	 */
	@ActionReducer()
	setReady(ready:boolean) {
		return (state:AppState) => state.merge({ ready })
	}
	
	/**
	 * Set the user
	 *
	 * @param user
	 * @param token
	 *
	 * @returns {Map<string, User>}
	 */
	@ActionReducer()
	setAuthenticated(user:User,token:string = null) {
		return (state:AppState) => state.withMutations((newState:AppState) => {
			let
				{settings} = newState
			
			if (!user || !token) {
				user = null
				token = null
			}
			
			settings = settings
				.set('user',user)
				.set('token',token) as Settings
			
			return newState
				.set('settings',settings)
				.set('user',user)
				.set('stateType',user && token ? AppStateType.Authenticated : AppStateType.AuthLogin)
		})
	}
	
	
	
	/**
	 * Update app settings
	 *
	 * @param newSettings
	 * @returns {(state:AppState)=>Map<string, ISettings>}
	 */
	@ActionReducer()
	setSettings(newSettings:Settings) {
		return (state:AppState) => {
			if (!(newSettings instanceof Settings))
				newSettings = new Settings(newSettings)
			return state
				.set('settings', newSettings)
				.set('user', newSettings.user)
		}
	}
	
	/**
	 * Update window state(s) on AppState
	 *
	 * @param clear
	 * @param id
	 * @param windowState
	 * @returns {(state:AppState)=>Map<string, Map<string, IWindowState>>}
	 */
	@ActionReducer()
	updateWindow(clear:boolean,...windowState:IWindowState[]) {
		return (state:AppState) => state.set(
			'windows',
			state.windows.withMutations(newWindowMap => {
				if (clear) {
					newWindowMap = newWindowMap.clear()
				}
				
				windowState.forEach(winState => {
					newWindowMap.set(winState.id,cloneObjectShallow(winState))
				})
				
				return newWindowMap
			})
		)
	}
	
	/**
	 * State reducer for the trayOpen value
	 *
	 * @param open
	 */
	@ActionReducer()
	private setTrayOpen(open:boolean) {
		return (state:AppState) => state.set('trayOpen',open)
	}
	
	private getTrayWindow() {
		const
			{windows} = this.state
		
		const
			winState = windows.find(it => it.type === WindowType.Tray)
		
		assert(winState,`Win state does not exist for a tray window`)
		
		return getWindowManagerClient().getWindowInstance(winState.id)
		
	}
	
	/**
	 * Open the tray window
	 */
	
	openTray() {
		if (this.state.trayOpen) {
			return log.debug(`Tray is already open`)
		}
		
		this.getTrayWindow().window.show()
		this.setTrayOpen(true)
	}
	
	/**
	 * Close the tray window
	 */
	
	closeTray() {
		if (!this.state.trayOpen) {
			return log.debug(`Tray is already closed`)
		}
		
		this.getTrayWindow().window.hide()
		this.setTrayOpen(false)
	}
	
	/**
	 * Set the current global state of the app
	 *
	 * @param stateType
	 * @returns {(state:AppState)=>Map<string, V>}
	 */
	@ActionReducer()
	setStateType(stateType:AppStateType) {
		return (state:AppState) => state.set('stateType', stateType)
	}
	
	/**
	 * Tells the main process to relaunch and clean
	 */
	clean() {
		require('electron').ipcRenderer.send(Events.Clean)
	}
	
	
}

declare global {
	interface IAppActionFactory extends AppActionFactory {
		
	}
}

/**
 * Export the action factory as the default
 */
export default AppActionFactory