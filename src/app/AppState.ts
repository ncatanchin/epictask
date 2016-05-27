

/**
 * Authentication State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import * as Settings from 'shared/Settings'
import * as Constants from 'shared/Constants'


@RecordModel()
class AppStateModel {

	@RecordProperty()
	stateType:AppStateType

	@RecordProperty()
	error:Error


	/**
	 * Set app state
	 *
	 * @returns {AuthStateModel}
	 * @param newStateType
	 */
	setStateType(newStateType:AppStateType) {
		this.stateType = newStateType
		return this
	}


	setError(err:Error) {
		this.error = err
		return this
	}

}

const AppStateDefaults = {
	stateType: Settings.get(Constants.GitHubToken) ? AppStateType.VerifyLogin : AppStateType.Login
}

export const AppState = makeRecord(AppStateModel,AppStateDefaults)
