

import { windowsSelector } from "epic-typedux/selectors"

import {
	WindowConfigNormalDefaults, JobServerWindowConfig, DatabaseServerWindowConfig
} from "epic-process-manager-client/WindowConfig"

import { getWindowManager } from "epic-process-manager"
import { cloneObject } from "epic-global/ObjectUtil"
import { AppEventType } from "epic-global/Constants"
import { WindowConfigTrayDefaults } from "epic-process-manager-client"

const
	log = getLogger(__filename)

/**
 * Load any pre-configured windows from state + background windows
 */
export async function start() {
	const
		windowManager = getWindowManager()
	
	
	let
		windowMap = windowsSelector(getStoreState()),
		
		normalWindows = windowMap
			.valueSeq()
			.filter(win => win.type === WindowType.Normal)
			.toArray() as IWindowConfig[]
	
	// MAKE SURE WE HAVE AT LEAST ONE NORMAL WINDOW
	if (!normalWindows.length)
		normalWindows.push(cloneObject(WindowConfigNormalDefaults) as any)
	
	const
		windows:IWindowConfig[] = [
			cloneObject(JobServerWindowConfig) as any,
			cloneObject(WindowConfigTrayDefaults) as any,
			...normalWindows
		]
	
	log.debug(`Opening windows`,windows)
	
	await windowManager.open(windows)
	
	// PUSH WINDOW STATES (DE-BOUNCED)
	windowManager.pushWindowStates()
}