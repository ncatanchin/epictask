

// import {getStoreState as getStoreStateType} from "shared/store/AppStore"
// import {AppKey} from "shared/Constants"
import {User} from "shared/models"
import {SettingsFile} from "shared/settings/SettingsFile"
import { getStateValue as getStateClientType } from "shared/AppStoreClient"
import { AppKey, SettingKeys, SettingDefaults } from "shared/Constants"
import { PersistentValue } from "shared/util/PersistentValue"


export const
	NativeNotificationsEnabled = new PersistentValue<boolean>(
		SettingKeys.NativeNotifications,
		SettingDefaults[SettingKeys.NativeNotifications],
		(val) => val ? 'true' : 'false',
		(raw) => ['true','1','yes'].includes(raw)
	)

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


export async function getSettingsFromState():Promise<ISettings> {
	if (ProcessConfig.isType(ProcessType.UI)) {
		return getSettingsFile()
	} else {
		const getStateClient = require("shared/AppStoreClient").getStateValue as typeof getStateClientType
		return await getStateClient(AppKey, 'settings')
	}
	// if
	// const
	// 	storeState = getStoreState(),
	// 	appState = storeState && storeState.get(AppKey),
	// 	settings = _.get(appState,'settings') as ISettings
	//
	// return settings || {isLoaded:false}
	
}

/**
 * Get the current settings from the AppState
 *
 * @returns {ISettings}
 */
export function getSettings():ISettings {
	return require('shared/settings/SettingsFile').Settings
	
}

/**
 * Get the mutable Settings file
 *
 * @returns {SettingsFile}
 */
export function getSettingsFile():ISettings {
	return require('shared/settings/SettingsFile').Settings as SettingsFile
}
