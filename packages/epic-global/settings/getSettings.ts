
import { Settings } from "./Settings"

import { settingsSelector } from "epic-typedux/selectors/AppSelectors"
import { getStoreState } from "epic-typedux/store/AppStore"


export function getSettings() {
	return settingsSelector(getStoreState()) || new Settings()
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
