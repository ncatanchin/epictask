import { ObservableStore } from "typedux"
import { Settings } from "./Settings"
import { AppKey } from "epic-global/Constants"
import { getValue } from "epic-global/ObjectUtil"

export function getSettings():Settings {
	
	return getValue(() =>
		(Container.get(ObservableStore as any) as any).getState().get(AppKey).settings)
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
