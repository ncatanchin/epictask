import { ActionFactory, ActionReducer, ActionThunk, ActionMessage } from 'typedux'

import { RegisterActionFactory,Events, AppKey } from "epic-global"
import { Provided,ISettings } from "epic-global"

import { User } from "epic-models"

import { AppState } from "../state/AppState"
import {AppStateType} from '../state/app/AppStateType'


const log = getLogger(__filename)

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
	 * @returns {Map<string, User>}
	 */
	@ActionReducer()
	setUser(user:User) {
		return (state:AppState) => state.set('user', user)
	}
	
	
	/**
	 * Update app settings
	 *
	 * @param newSettings
	 * @returns {(state:AppState)=>Map<string, ISettings>}
	 */
	@ActionReducer()
	updateSettings(newSettings:ISettings) {
		return (state:AppState) => {
			return state.set('settings', newSettings).set('user', newSettings.user)
		}
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