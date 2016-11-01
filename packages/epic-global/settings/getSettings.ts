
import { Settings } from "./Settings"
import { AppKey } from "epic-global/Constants"
import { AppState } from "epic-typedux/state/AppState"


export function getSettings() {
	return (getStoreState().get(AppKey) as AppState).settings
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
