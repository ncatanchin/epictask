import Electron = require('electron')
import { IWindowManagerClient } from "epic-process-manager/WindowManager"



/**
 * If on the main process, return the real thing
 *  - otherwise RPC ref from Electron.remote
 *
 * @returns {WindowManager}
 */
export function getWindowManagerClient():IWindowManagerClient {
	
	return Env.isMain ?
		require('epic-process-manager/WindowManager').getWindowManager() :
		Electron.remote.getGlobal('getWindowManager')()
}