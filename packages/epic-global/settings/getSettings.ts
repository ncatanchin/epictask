

import { getValue } from "typeguard"


export function getSettings():ISettings {
	const
		appActions = Registry.Service.AppActions as IAppActionFactory
	
	return getValue(() => appActions.state.settings as any)
	
	// return getValue(() =>
	// 	getStoreState().get(AppKey).settings
	// )
}

export function updateSettings(newSettings:ISettingsProps) {
	let
		settings = getSettings()
	
	
	if (!settings)
		return
	
	Object.keys(newSettings).forEach(key => {
		settings = settings.set(key,newSettings[key])
	})
	
	
	const
		appActions = Registry.Service.AppActions as IAppActionFactory
	
	appActions.setSettings(settings as any)
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
