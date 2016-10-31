import Electron = require('electron')
import { WindowManager } from "epic-process-manager/WindowManager"

/**
 * We ONLY want the interface exported, we don't want the module loaded
 */
export interface IWindowManagerClient extends WindowManager {
	
}

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