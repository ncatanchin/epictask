

import { getValue } from "typeguard"
import { ActionFactoryKeyMap ,AppKey } from "epic-global/Constants"



function getAppActions() {
	return Scopes.Services.get(ActionFactoryKeyMap[AppKey]) as IAppActionFactory
}

export function getSettings():ISettings {
	return getValue(() => getStoreState().get(AppKey).settings as any)
}

export function updateSettings(newSettings:ISettingsProps) {
	let
		settings = getSettings()
	
	
	if (!settings)
		return
	
	Object.keys(newSettings).forEach(key => {
		settings = settings.set(key,newSettings[key])
	})
	
	getAppActions().setSettings(settings as any)
}


/**
 * Expose getSettings
 */
declare global {
	function getSettings():ISettings
	function updateSettings(settings:ISettingsProps)
}

assignGlobal({
	getSettings,
	updateSettings
})
