import { ActionFactory, ActionReducer, ActionMessage } from "typedux"
import {
	RegisterActionFactory, Events, AppKey, Provided, cloneObjectShallow,
	shortId
} from "epic-global"

import { User } from "epic-models"
import { AppState } from "../state/AppState"
import { AppStateType } from "../state/app/AppStateType"
import { Settings } from "epic-global/settings/Settings"


const
	log = getLogger(__filename)


/**
 * Core EpicTask actions
 */
@RegisterActionFactory
@Provided
export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> {
	
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