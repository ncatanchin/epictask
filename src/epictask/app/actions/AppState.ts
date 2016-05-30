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

/**
 * Enumeration describing app status type
 */
export enum StatusType {
	Ready,
	Loading
}

/**
 * Simple status management for the app overall
 */
export interface IStatus {
	type:StatusType,
	message?:string
}

@RecordModel()
class AppStateModel {

	@RecordProperty()
	stateType:AppStateType

	@RecordProperty()
	theme:any
	
	@RecordProperty()
	status:IStatus
	
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
	
	setTheme(theme:any) {
		this.theme = theme
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