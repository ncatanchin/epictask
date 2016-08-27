

import {getStoreState} from "shared/store"
import {AppKey} from "shared/Constants"
import {User} from "shared/models"
import {SettingsFile} from "server/SettingsFile"

/**
 * Settings interface
 */
export interface ISettings {
	/**
	 * Settings have been loaded from file
	 */
	isLoaded:boolean
	
	/**
	 * GitHub token
	 */
	token?:string
	
	/**
	 * Disable auto sync
	 */
	disableAutoSync?:boolean
	
	/**
	 * The current authenticated user
	 */
	user?:User
}


function getSettingsFromState() {
	const
		storeState = getStoreState(),
		appState = storeState && storeState.get(AppKey),
		settings = _.get(appState,'settings') as ISettings
	
	return settings || {isLoaded:false}
}

/**
 * Get the current settings from the AppState
 *
 * @returns {ISettings}
 */
export function getSettings():ISettings {
	const settings = (ProcessConfig.isType(ProcessType.StateServer)) ?
		require('server/SettingsFile').Settings :
		getSettingsFromState()
	
	return settings || {}
	
}

/**
 * Get the mutable Settings file
 *
 * @returns {SettingsFile}
 */
export function getSettingsFile():ISettings {
	if (!ProcessConfig.isType(ProcessType.StateServer))
		throw new Error('Settings file is ONLY available on the state server')
	
	return require('server/SettingsFile').Settings as SettingsFile
}
