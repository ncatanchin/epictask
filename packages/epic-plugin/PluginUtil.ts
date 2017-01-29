import { getValue } from "typeguard"

export function isPluginEnabled(config:IPluginConfig) {
	const
		settings = getSettings()
	
	return getValue(() => settings && settings.pluginsEnabled[config.name] !== false, true)
}