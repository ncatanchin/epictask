

import { windowsSelector } from "epic-typedux/selectors"

import {
	WindowConfigNormalDefaults, JobServerWindowConfig, DatabaseServerWindowConfig
} from "epic-process-manager-client/WindowConfig"

import { getWindowManager } from "epic-process-manager"
import { cloneObject } from "epic-global/ObjectUtil"
import { AppEventType } from "epic-global/Constants"

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
		normalWindows.push(cloneObject(WindowConfigNormalDefaults) as any)
	
	const
		dbReady = Promise.defer()
	
	EventHub.on(AppEventType.DatabaseReady,(event:AppEventType, errJson:any) => {
		if (errJson) {
			const
				err = new Error(errJson.message)
			log.error(`DB failed to init`,errJson,err)
			dbReady.reject(err)
			return
		}
		
		dbReady.resolve()
	})
	
	log.info(`Starting DB Window`)
	const
		windowManager = getWindowManager()
	
	await windowManager.open(DatabaseServerWindowConfig)
	await dbReady.promise
	
	log.info(`DB is ready`)
	
	const
		windows:IWindowConfig[] = [
			JobServerWindowConfig,
			...normalWindows
		]
	
	log.debug(`Opening windows`,windows)
	
	await windowManager.open(windows)
	
	// PUSH WINDOW STATES (DE-BOUNCED)
	windowManager.pushWindowStates()
}