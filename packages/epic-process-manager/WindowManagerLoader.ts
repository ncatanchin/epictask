

import { windowsSelector } from "epic-typedux/selectors"
import { getStoreState } from "epic-typedux/store"
import {
	WindowBackgroundConfigs,
	WindowConfigNormalDefaults
} from "epic-process-manager-client/WindowConfig"
import {
	WindowType,
	
	IWindowConfig
} from "epic-process-manager-client/WindowTypes"
import { cloneObjectShallow } from "epic-global"
import { getWindowManager } from "epic-process-manager/WindowManager"
import {List} from 'immutable'

const
	log = getLogger(__filename)

/**
 * Load any pre-configured windows from state + background windows
 */
export async function start() {
	
	let
		windowMap = windowsSelector(getStoreState()),
	
		normalWindows = windowMap
			.valueSeq()
			.filter(win => win.type === WindowType.Normal)
			.toArray() as IWindowConfig[]
	
	// MAKE SURE WE HAVE AT LEAST ONE NORMAL WINDOW
	if (!normalWindows.length)
		normalWindows.push(WindowConfigNormalDefaults as any)
			
	const
		windows:IWindowConfig[] = [
			...WindowBackgroundConfigs,
			...normalWindows
		],
		
		windowManager = getWindowManager()
	
	log.debug(`Opening windows`,windows)
	
	await windowManager.open(windows)
	
	// PUSH WINDOW STATES (DEBOUNCED)
	windowManager.pushWindowStates()
}