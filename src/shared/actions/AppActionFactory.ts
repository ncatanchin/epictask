import {AutoWired,Inject, Container} from 'typescript-ioc'
import {ActionFactory,Action,ActionReducer,ActionMessage} from 'typedux'
import {AppStateType} from '../AppStateType'

import {AppKey, RepoTransientProps} from "../Constants"
import {ISettings} from '../Settings'
import {AppState} from './AppState'
import {User} from '../models/User'


const log = getLogger(__filename)

/**
 * Update the transient values on an issue
 *
 * @param issue
 * @param availableRepos
 */
function updateIssueTransients(issue,availableRepos) {

	const
		{repoId} = issue,
		availRepo = availableRepos.find(availRepo => availRepo.repoId === repoId)

	assert.ok(availRepo,'Unable to find repo with id: ' + repoId)

	// Assign all transient props
	Object.assign(issue,_.pick(availRepo.repo,RepoTransientProps))
}

@AutoWired
export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> {

	constructor() {
		super(AppState)
	}

	leaf():string {
		return AppKey;
	}

	/**
	 *
	 * @param state
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
	 * @param state
	 * @param user
	 * @returns {Map<string, User>}
	 */
	@ActionReducer()
	setUser(user:User) {
		return (state:AppState) => state.set('user',user)
	}


	@ActionReducer()
	updateSettings(newSettings:ISettings) {
		return (state:AppState) => state.set('settings', newSettings)
	}

	@ActionReducer()
	setStateType(stateType:AppStateType) {
		return (state:AppState) => state.merge({stateType})
	}


}

export type AppActionFactoryType = typeof AppActionFactory
export type AppActionFactoryConstructor = AppActionFactory
export default AppActionFactory