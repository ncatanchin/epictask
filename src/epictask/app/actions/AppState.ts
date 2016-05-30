import 'reflect-metadata'

/**
 * Authentication State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {AppStateType} from '../../shared/AppStateType'
import {Settings} from '../../shared'

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
	stateType: ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
}

export const AppState = makeRecord(AppStateModel,AppStateDefaults)
export type TAppState = typeof AppState