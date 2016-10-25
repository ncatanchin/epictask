
import {SettingsFile} from "./SettingsFile"
import { AppKey, SettingKeys, SettingDefaults } from "epic-global"
import { PersistentValue } from  "../PersistentValue"


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
	user?:any
}


export async function getSettingsFromState():Promise<ISettings> {
	if (ProcessConfig.isType(ProcessType.UI)) {
		return getSettingsFile()
	} else {
		//const getStateClient = require("shared/AppStoreClient").getStateValue as typeof getStateClientType
		//return await getStateClient(AppKey, 'settings')
		return null
	}
	
}

/**
 * Get the current settings from the AppState
 *
 * @returns {ISettings}
 */
export function getSettings():ISettings {
	return require('./SettingsFile').Settings
	
}

/**
 * Get the mutable Settings file
 *
 * @returns {SettingsFile}
 */
export function getSettingsFile():ISettings {
	return require('./SettingsFile').Settings as SettingsFile
}
