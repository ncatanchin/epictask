
import { getValue } from "epic-global/ObjectUtil"



export function getSettings():ISettings {
	return getValue(() => require("epic-typedux/provider")
			.getAppActions()
			.state.settings,null)
	
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

	
	require("epic-typedux/provider")
		.getAppActions()
		.setSettings(settings)
}

assignGlobal({
	getSettings,
	updateSettings
})

/**
 * Expose getSettings
 */
declare global {
	function getSettings():ISettings
	function updateSettings(settings:ISettingsProps)
}
