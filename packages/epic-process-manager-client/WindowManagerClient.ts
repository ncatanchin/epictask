import Electron = require('electron')
import { WindowManager } from "epic-process-manager/WindowManager"
import { ProcessType } from "epic-entry-shared/ProcessType"

/**
 * Window Type
 */
export enum WindowType {
	Normal,
	Dialog,
	Modal,
	BackgroundWorker
}


/**
 * Dev tools position
 */
export type TDevToolsPosition = 'right'|'bottom'|'undocked'|'detach'

/**
 * Default dev tools position
 */
export const DevToolsPositionDefault:TDevToolsPosition = 'undocked'

/**
 * Window Configuration
 */
export interface IWindowConfig {
	
	/**
	 * Configuration name
	 */
	name:string
	
	
	/**
	 * Window type, this drivers parent/child enforcement
	 */
	type:WindowType
	
	
	/**
	 * The process type, only application if type = backgroundworker
	 */
	processType?:ProcessType
	
	
	/**
	 * THe entry URI
	 */
	uri?:string
	
	/**
	 * Should the window auto restart
	 */
	autoRestart:boolean
	
	/**
	 * In dev mode - show dev tools
	 */
	showDevTools?:boolean
	
	devToolsPosition?:TDevToolsPosition
	
	/**
	 * Store the windows state for future openings
	 */
	
	storeState?:boolean
	
	/**
	 * Only allow this config to exist 1 at a time
	 */
	singleWindow?:boolean
	
	/**
	 * Window options (Browser Window)
	 */
	opts?:Electron.BrowserWindowOptions
	
}

/**
 * Window state
 */
export interface IWindowState extends IWindowConfig {
	id:string
	
	url:string
	
	
	running: boolean
	connected: boolean
	killed:boolean
	destroyed:boolean
	crashed:boolean
	closed:boolean
	unresponsive:boolean
	focused:boolean
	visible:boolean
	
	
	heartbeatTimestamp:number
	heartbeatCount:number
	
	onMessage: (type,body) => any
}

/**
 * Actual instance
 */
export interface IWindowInstance extends IWindowState {
	window:Electron.BrowserWindow
	webContents?:Electron.WebContents
	config?:IWindowConfig
	
	heartbeatTimeoutId:any
	connectedFlag:Promise.Resolver<boolean>
}


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