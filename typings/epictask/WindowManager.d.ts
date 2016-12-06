/// <reference path="../../node_modules/@types/electron/index.d.ts"/>

declare enum WindowType {
	Normal = 1,
	Dialog = 2,
	Modal = 3,
	Background = 4
}

/**
 * Dev tools position
 */
declare type TDevToolsPosition = 'right'|'bottom'|'undocked'|'detach'


/**
 * Window Configuration
 */
declare interface IWindowConfig {
	
	/**
	 * An id can be provided
	 */
	id?:string
	
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
	
	storeWindowState?:boolean
	
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
declare interface IWindowState extends IWindowConfig {
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
declare interface IWindowInstance extends IWindowState {
	window:Electron.BrowserWindow
	webContents?:Electron.WebContents
	pool?:any
	config?:IWindowConfig
	allEventRemovers?:any
	heartbeatTimeoutId:any
	connectedFlag:Promise.Resolver<boolean>
	shutdownFlag:Promise.Resolver<boolean>
}

