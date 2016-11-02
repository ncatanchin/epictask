
import { Settings } from "./Settings"
import { AppKey } from "epic-global/Constants"


export function getSettings():Settings {
	return (getStoreState().get(AppKey)).settings
}


assignGlobal({
	getSettings
})

/**
 * Expose getSettings
 */
declare global {
	function getSettings():Settings
}
