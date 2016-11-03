import { ActionFactory, ActionReducer, ActionMessage } from "typedux"
import { RegisterActionFactory, Events, AppKey, Provided, cloneObjectShallow } from "epic-global"

import { User } from "epic-models"
import { AppState } from "../state/AppState"
import { AppStateType } from "../state/app/AppStateType"
import { Settings } from "epic-global/settings/Settings"


const
	log = getLogger(__filename)

// /**
//  * Update the transient values on an issue
//  *
//  * @param issue
//  * @param availableRepos
//  */
// function updateIssueTransients(issue,availableRepos) {
//
// 	const
// 		{repoId} = issue,
// 		availRepo = availableRepos.find(availRepo => availRepo.repoId === repoId)
//
// 	assert.ok(availRepo,'Unable to find repo with id: ' + repoId)
//
// 	// Assign all transient props
// 	Object.assign(issue,_.pick(availRepo.repo,RepoTransientProps))
// }


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
	 * @param id
	 * @param windowState
	 * @returns {(state:AppState)=>Map<string, Map<string, IWindowState>>}
	 */
	@ActionReducer()
	updateWindow(...windowState) {
		return (state:AppState) => state.set(
			'windows',
			state.windows.withMutations(newWindowMap => {
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

/**
 * Export the action factory as the default
 */
export default AppActionFactory