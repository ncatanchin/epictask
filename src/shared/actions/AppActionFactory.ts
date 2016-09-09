
import {ActionFactory,ActionReducer,ActionMessage} from 'typedux'
import {AppStateType} from 'shared/AppStateType'

import {AppKey} from "shared/Constants"
import {ISettings} from 'shared/Settings'
import {AppState} from 'shared/actions/AppState'
import {User} from 'shared/models/User'
import {Provided} from 'shared/util/ProxyProvided'

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
@Provided
export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppState)
	}

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
		return (state:AppState) => state.merge({ready})
	}

	/**
	 * Set the user
	 *
	 * @param user
	 * @returns {Map<string, User>}
	 */
	@ActionReducer()
	setUser(user:User) {
		return (state:AppState) => state.set('user',user)
	}
	
	
	/**
	 * Update app settings
	 *
	 * @param newSettings
	 * @returns {(state:AppState)=>Map<string, ISettings>}
	 */
	@ActionReducer()
	updateSettings(newSettings:ISettings) {
		return (state:AppState) => state.set('settings', newSettings)
	}
	
	/**
	 * Set the current global state of the app
	 *
	 * @param stateType
	 * @returns {(state:AppState)=>Map<string, V>}
	 */
	@ActionReducer()
	setStateType(stateType:AppStateType) {
		return (state:AppState) => state.merge({stateType})
	}


}

/**
 * Export the action factory as the default
 */
export default AppActionFactory