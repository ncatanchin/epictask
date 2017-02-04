import { List } from "immutable"

import Electron from "epic-electron"

import {
	getHot,
	setDataOnHotDispose,
	acceptHot,
	getBrowserEntryHtmlPath,
	isString,
	isList,
	cloneObject,
	attachEvents,
	cloneObjectShallow,
	Events,
	getValue,
	SimpleEventEmitter,
	HEARTBEAT_TIMEOUT, makeBrowserEntryURL, guard
} from "epic-global"

import { DevToolsPositionDefault, WindowOptionDefaults } from "epic-process-manager-client/WindowConfig"
import WindowPool from "./WindowPool"
import { WindowPositionManager } from "epic-process-manager/WindowPositionManager"
import { isNumber } from "typeguard"
import { shortId } from "epic-util"

assert(Env.isMain,`WindowManager ONLY loads on main`)

const
	log = getLogger(__filename)
	
// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	{ app, ipcMain } = Electron,
	
	// Container to support hot reloading
	instanceContainer = ((global as any).instanceContainer || {}) as {
		clazz:typeof WindowManager,
		instance:WindowManager,
		hotInstance:WindowManager
	}


/**
 * Window message handler
 */
export interface IWindowMessageHandler {
	(manager:WindowManager, instance:IWindowInstance, type:string, body?:any):any
}


/**
 * shallow clones window instance omitting complex objects
 *
 * @param instance
 * @returns {IWindowState}
 */
function convertInstanceToState(instance:IWindowInstance):IWindowState {
	return _.omit(instance,
		'heartbeatTimestamp',
		'heartbeatTimeoutId',
		'connectedFlag',
		'shutdownFlag',
		'heartbeatCount',
		'config',
		'pool',
		'window',
		'windowPositionManager',
		'allEventRemovers',
		'webContents',
		'onMessage',
		'opts'
	) as IWindowState
}


//noinspection JSValidateJSDoc
/**
 * Create window options
 *
 * @param type
 * @param opts
 * @returns {Electron.BrowserWindowOptions}
 */
function makeBrowserWindowOptions(type:WindowType, opts:Electron.BrowserWindowOptions = {}):Electron.BrowserWindowOptions {
	return _.merge(
		{
			//backgroundColor: require('epic-styles').getPalette().background
		},
		
		// TYPE DEFAULTS
		cloneObject(WindowOptionDefaults[ type ]),
		
		// CONFIG DEFAULTS
		// ([ WindowType.Dialog, WindowType.Modal ].includes(type)) && {
		// 	parent: BrowserWindow.getFocusedWindow()
		// },
		
		// CUSTOM OPTS
		opts
	)
}
/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class WindowManager {
	
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new WindowManager()
		
		return instanceContainer.instance
	}
	
	
	private messageEmitter = new SimpleEventEmitter<IWindowMessageHandler>()
	
	
	private windows:IWindowInstance[] = []
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		
		ipcMain.on(Events.ProcessMessage, this.onProcessMessage)
	}
	
	/**
	 * Handler for all process messages
	 *
	 * @param event
	 * @param type
	 * @param body
	 */
	private onProcessMessage = (event, type, body) => {
		const
			senderWebContents:Electron.WebContents = event.sender,
			win = this.getWindowInstance(senderWebContents)
		
		if (!win)
			return log.error(`Received a message on main from an unknown sender ${type}`, senderWebContents)
		
		win.onMessage(type, body)
	}
	
	/**
	 * Retrieve windows
	 */
	get all() {
		return [ ...this.windows ]
	}
	
	/**
	 * get a window instance
	 *
	 * @param idOrContents
	 * @returns {IWindowInstance}
	 */
	getWindowInstance(idOrContents:number|Electron.WebContents) {
		return this.windows.find(win =>
			[ win.id, win.name, win.webContents ].includes(idOrContents))
	}
	
	isWindowInstancePersistent(idOrContents:number|Electron.WebContents) {
		const
			win = this.getWindowInstance(idOrContents)
		
		return win && !win.closed &&  (win.type === WindowType.Background ||
			(WindowType.Normal === win.type))
	}
	
	/**
	 * Gracefully shutdown all windows
	 */
	async shutdown() {
		
		const
			closePromises = this.windows
				.filter(win =>
					// NOT ALREADY SHUTDOWN && NORMAL/BACKGROUND
					!win.shutdownFlag &&
					this.isWindowInstancePersistent(win.id)
				)
				.map(win => {
					win.shutdownFlag = Promise.defer()
					win.window.webContents.send(WindowEvents.Shutdown)
					
					return win.shutdownFlag
						.promise
						.timeout(5000)
						.catch(err => {
							log.error(`Failed to shutdown ${win.id}`,err)
							return Promise.resolve(true)
						})
				})
		
		log.debug(`Waiting for ${closePromises.length} shutdown promises`)
		await Promise.all(closePromises)
		log.debug(`All windows shutdown`)
	}
	
	
	/**
	 * Get the list
	 *
	 * @returns {IWindowInstance[]}
	 */
	getWindowInstances() {
		return List(this.windows)
	}
	
	/**
	 * Returns all window states based on internal window instances
	 *
	 * @returns {IWindowState[]}
	 */
	getWindowStates() {
		return this.windows.map(convertInstanceToState)
	}
	
	
	/**
	 * Pushes the window states to AppState
	 */
	pushWindowStates = _.debounce(() => {
		app.emit(Events.WindowStatesChanged, this.getWindowStates())
	}, 150)
	
	/**
	 * Patch window state
	 *
	 * @param id
	 * @param patch
	 * @param remove - singleWindows delete themselves on close
	 *
	 */
	private updateWindowState(id:number, patch:any, remove = false) {
		const
			win = this.getWindowInstance(id)
		
		if (!win) {
			log.warn(`Unknown window: ${id}`)
			return
		}
		
		if (win.closed && win.shutdownFlag && !win.shutdownFlag.promise.isResolved()) {
			win.shutdownFlag.resolve(true)
		}
		
		const
			index = this.windows.findIndex(it => it.id === win.id)
		
		if (remove) {
			this.windows.splice(index, 1)
		} else {
			this.windows[ index ] = cloneObjectShallow(win, patch)
		}
		
		this.pushWindowStates()
		
	}
	
	/**
	 * On window exit
	 *
	 * @param id
	 * @param patch
	 * @param remove
	 */
	private onWindowExit(id:number, patch,remove:boolean = false) {
		this.updateWindowState(
			id,
			assign(patch, {
				connected: false,
				running: false
			}),
			remove)
		
		log.info(`Window exited`, patch)
		
	}
	
	/**
	 * Is the worker currently running
	 *
	 * @returns {boolean}
	 */
	isRunning(id:number):boolean {
		const
			win = this.getWindowInstance(id)
		
		return getValue(() => win.window && !win.closed && !win.destroyed && !win.crashed && !win.killed)
	}
	
	
	/**
	 * Update heartbeat and schedule next
	 */
	private heartbeat(id:number) {
		const
			win = this.getWindowInstance(id)
		
		if (!win)
			return
		
		win.heartbeatCount++
		log.debug('Updating heartbeat', win.heartbeatCount)
		
		
		this.clearHeartbeatTimeout(id)
		win.heartbeatTimestamp = Date.now()
		this.scheduleHeartbeat(id)
	}
	
	/**
	 * Clear pending timeout
	 *
	 * @param id
	 */
	private clearHeartbeatTimeout(id:number) {
		const
			win = this.getWindowInstance(id)
		
		if (win && win.heartbeatTimeoutId) {
			clearTimeout(win.heartbeatTimeoutId)
			win.heartbeatTimeoutId = null
		}
	}
	
	/**
	 * Send a message to child
	 *
	 * @param id - window id
	 * @param type
	 * @param body
	 * @param callback
	 */
	sendMessage(id, type:string, body:any = {}, callback?:(err:Error) => void) {
		if (!this.isRunning(id)) {
			return log.error(`Process is not ready for messages ${id}/${type}`)
		}
		
		const
			win = this.getWindowInstance(id)
		
		log.debug(`Sending Message (${type})`)
		
		win.webContents.send('message', { type, body })
	}
	
	
	/**
	 * Schedule next heartbeat
	 */
	private scheduleHeartbeat(id:number) {
		const
			win = this.getWindowInstance(id)
		
		if (this.isRunning(id)) {
			win.heartbeatTimeoutId = global.setTimeout(() => this.sendHeartbeat(id), HEARTBEAT_TIMEOUT)
		}
	}
	
	/**
	 * Send heartbeat message
	 */
	private sendHeartbeat(id:number) {
		this.clearHeartbeatTimeout(id)
		
		if (!this.isRunning(id))
			return
		
		const
			win = this.getWindowInstance(id)
		
		
		this.sendMessage(id, WindowEvents.Ping)
		this.scheduleHeartbeat(id)
	}
	
	/**
	 * Create ipc message handler
	 * @param id
	 * @returns {(type:any, message:any)=>undefined}
	 */
	private makeOnIpcMessage(id) {
		return (type, body) => {
			
			const
				win = this.getWindowInstance(id)
			
			switch (type) {
				case WindowEvents.Pong:
					if (!win.connectedFlag.promise.isResolved())
						win.connectedFlag.resolve(true)
					
					this.heartbeat(id)
					break
				case WindowEvents.ShutdownComplete:
					log.debug(`Window shutdown completed: ${id}`)
					win.shutdownFlag.resolve(true)
					break
				default:
					this.messageEmitter.emit(this, win, type, body)
			}
		}
	}
	
	/**
	 * Completes connection to client webview
	 */
	private makeConnect(id:number) {
		return () => {
			
			let
				win = this.getWindowInstance(id)
			//this.showIfEnabled()
			
			// Setup communications verification
			let
				tryCount = 0
			
			win.heartbeatTimeoutId = null
			
			const tryConnection = () => {
				
				tryCount++
				
				log.debug(`Communication attempt #${tryCount} for ${id}`)
				
				const retry = () => {
					// Try again in a sec
					this.clearHeartbeatTimeout(id)
					
					win = this.getWindowInstance(id)
					
					if (!win)
						return
					
					// Wrap retry to clear id
					win.heartbeatTimeoutId = setTimeout(() => {
						this.clearHeartbeatTimeout(id)
						tryConnection()
					}, 100)
				}
				
				
				win = this.getWindowInstance(id)
				
				if (win && !win.heartbeatTimeoutId && this.isRunning(id) && !win.connectedFlag.promise.isPending()) {
					
					this.sendMessage(id, WindowEvents.Ping, null, (err) => {
						if (err) {
							log.warn('Can not send message to worker', err)
						}
					})
				}
				
				retry()
			}
			
			tryConnection()
		}
	}
	
	/**
	 * On window closed
	 *
	 * @param event
	 * @param windowInstance
	 */
	onWindowClosed = (event,windowInstance:IWindowInstance = null) => {
		if (windowInstance) {
			const
				{singleWindow,autoRestart,id,config} = windowInstance
			
			log.info(`Window closed: ${id}`)
			this.onWindowExit(id, { closed: true }, singleWindow || autoRestart)
			//this.updateWindowState(id, { closed: true }, singleWindow || autoRestart)
			if (!shutdownInProgress && !isShuttingDown()) {
				if (autoRestart) {
					log.warn(`Auto Restarting Window: ${id}`)
					setImmediate(() => this.open(config))
				}
				
			}
		}
		
		EventHub.broadcast(EventHub.WindowClosed)
	}
	/**
	 * Close all windows
	 */
	closeAll() {
		this.close(...this.windows)
	}
	
	
	
	/**
	 * Close a dialog with a specific id
	 *
	 * @param idsOrNames
	 */
	close(...idsOrNames:number[])
	/**
	 * Window instances
	 * @param windowInstances
	 */
	close(...windowInstances:IWindowState[])
	close(...idOrWindowInstances:Array<IWindowState|number>) {
		let
			
			// CREATE REMOVE LIST
			windowsToClose:IWindowInstance[] = this.windows.filter(it =>
				idOrWindowInstances.find(criteria => isNumber(criteria) || isString(criteria) ?
					
					// IF IDS OR CONFIG NAMES - MATCH
					[ it.id, it.config.uri, it.url ].includes(criteria) :
					
					// IF WINDOW INSTANCES
					(it === criteria || it.id === criteria.id)
				)
			)
		
		//log.debug(`Going to close windows`,windowsToClose,'from config',idOrWindowInstances)
		// ITERATE AND DESTROY/REMOVE
		while (windowsToClose.length) {
			const
				win:IWindowInstance = windowsToClose.shift(),
				{pool,window,id:windowId,type:windowType,processType} = win,
				index = this.windows.findIndex(it => it.id === win.id)
				 
			
			
			try {
				log.debug(`Cleaning window for reuse: ${windowId}`)
				
				log.debug(`Removing event listeners: ${windowId}`)
				win.allEventRemovers.forEach(it => guard(it))
				
				if (window.isVisible()) {
					log.debug(`Hiding: ${windowId}`)
					window.hide()
				}
				
				log.debug(`Returning window to pool: ${windowId}`)
				pool.release(window)
			} catch (err) {
				log.warn(`Unable to recycle window - destroying in pool: ${windowId}`, err)
				
				pool.destroy(window)
			}
			
			this.onWindowClosed(null,win)
			
			
			if (index > -1) {
				this.windows.splice(index, 1)
			}
			
			
		}
		
		// IF ALL WINDOWS ARE CLOSED THEN NOTIFY
		if (this.windows.filter(it => it.type !== WindowType.Background)) {
			EventHub.emit(EventHub.AllWindowsClosed)
		}
		
	}
	
	/**
	 * Open without waiting for a result
	 *
	 * @param config
	 */
	openAndReturn(config:IWindowConfig)
	openAndReturn(configs:List<IWindowConfig>|Array<IWindowConfig>)
	openAndReturn(configOrConfigs:IWindowConfig|List<IWindowConfig>|Array<IWindowConfig>) {
		setImmediate(() =>
			//EventHub.emit(WindowOpen,configOrConfigs)
			this.open(configOrConfigs as any)
		)
		return null
	}
	
	/**
	 * Open a new dialog with a given config
	 *
	 * @param config
	 *
	 * @returns {{id: string, config: IWindowConfig, window: Electron.remote.BrowserWindow}}
	 */
	async open(config:IWindowConfig)
	/**
	 * Configs
	 *
	 * @param configs
	 */
	async open(configs:List<IWindowConfig>|Array<IWindowConfig>)
	async open(configOrConfigs:IWindowConfig|List<IWindowConfig>|Array<IWindowConfig>) {
		if (isList(configOrConfigs) || Array.isArray(configOrConfigs)) {
			const
				configs =
					Array.isArray(configOrConfigs) ?
						configOrConfigs :
						configOrConfigs.toArray()
			
			const
				windowPromises = configs.map(it => this.open(it))
			await Promise.all(windowPromises)
			return true
		}
		
		const
			originalConfig:IWindowConfig = cloneObject(configOrConfigs),
			config:IWindowConfig = cloneObject(configOrConfigs) as IWindowConfig
		
		let
			{ opts = {} } = config
		
		const
			windowCreateDeferred = Promise.defer(),
			
			{
				type,
				uri,
				singleWindow = false,
				autoRestart = false,
				showDevTools = false,//Env.isDev,
				processType = ProcessType.UI
			} = config
		
		assert(!singleWindow || !this.windows.find(it => it.config.name === config.name),
			`Window ${config.name} is marked as a single instance, but there is already one open`)
		
		
		try {
			
			const
				newWindowOpts = makeBrowserWindowOptions(type, opts),
				positionId = config.positionId || (singleWindow ? config.name : shortId())
			
			// CREATE WINDOW AND GET TO WORK
			const
				pool = WindowPool.get(processType,type),
				newWindow = await pool.acquire(), //new Electron.BrowserWindow(Object.assign({}, newWindowOpts, savedWindowState)),
				id = newWindow.id
			
			
			
			const
				// POSITION MANAGER
				windowPositionManager = new WindowPositionManager(newWindow,positionId),
				
				// URL
				url = makeBrowserEntryURL(uri),
				
				// INSTANCE OBJECT
				windowInstance = this.windows[ this.windows.length ] = cloneObjectShallow(config, {
					id,
					positionId,
					pool,
					type,
					opts: newWindowOpts as any,
					uri,
					url,
					autoRestart,
					destroyed: false,
					crashed: false,
					closed: false,
					unresponsive: false,
					focused: false,
					visible: false,
					killed: false,
					running: true,
					connected: false,
					windowPositionManager,
					heartbeatTimestamp: 0,
					heartbeatCount: 0,
					window: newWindow,
					allEventRemovers: [windowPositionManager.attach()],
					
					config
				}) as IWindowInstance
			
			assign(windowInstance, {
				onMessage: this.makeOnIpcMessage(id),
				connectedFlag: windowCreateDeferred
			})
			
			
			// IF WE HAVE A WINDOW STATE MANAGER THEN GO TO WORK
			// if (savedWindowState) {
			// 	savedWindowState.manage(newWindow)
			// }
			
			//REMOVE DEFAULT MENU
			newWindow.setMenu(null)
			
			let
				cleanedUrl = url.replace(/\\/g,'/')
				//cleanedUrl = url.replace(/\\/g,'\\\\')
			
			log.debug(`Loading dialog ${id} with URL:`, cleanedUrl)
			//newWindow.loadURL(url)
			newWindow.webContents.executeJavaScript((`
				console.log("Setting Route URL in config: ${cleanedUrl}");
				window.location.href = "${cleanedUrl}";
			`))
			
			// OPEN DEV TOOLS IF CONFIGURED
			if (DEBUG && showDevTools) {
				//newWindow.show()
				newWindow.webContents.openDevTools({
					mode: DevToolsPositionDefault
				})
			}
			
			
			// EVENTS
			const
				makeOnFocus = (focused:boolean) => () => this.updateWindowState(id, { focused }),
				makeOnUnresponsive = (unresponsive:boolean) => () => this.updateWindowState(id, { unresponsive }),
				makeOnShow = (shown:boolean) => () => this.updateWindowState(id, { visible: shown })
			
			
			windowInstance.allEventRemovers.push(attachEvents(log, newWindow, {
				closed: (event) => {
					this.onWindowClosed(event,windowInstance)
				},
				responsive: makeOnUnresponsive(false),
				unresponsive: makeOnUnresponsive(true),
				focus: makeOnFocus(true),
				blur: makeOnFocus(false),
				show: makeOnShow(true),
				hide: makeOnShow(false),
			}))
			
			
			// SET WEB-CONTENTS
			const
				{ webContents } = newWindow
			
			assign(windowInstance, { webContents })
			
			// WEB-CONTENTS EVENTS
			const
				onNavigate = (event, url) => this.updateWindowState(id, { url })
			
			windowInstance.allEventRemovers.push(attachEvents(log, webContents, {
				'did-navigate': onNavigate,
				'did-navigate-in-page': onNavigate,
				'ipc-message': windowInstance.onMessage,
				crashed: (event, killed) => this.onWindowExit(id, { crashed: true, killed: true }),
				destroyed: () => this.onWindowExit(id, { closed: true, destroyed: true }),
			}))
			
			log.debug(`Starting connect process: ${newWindow.id}`)
			
			this.makeConnect(id)
			
			if (processType === ProcessType.UI && windowInstance.hide !== true) {
				log.debug(`Showing and focusing`)
				newWindow.show()
				newWindow.focus()
			}
			
			windowCreateDeferred.resolve()
			
		} catch (err) {
			windowCreateDeferred.reject(err)
		}
		
		await windowCreateDeferred
			.promise
			.timeout(60000)
		return true
		
	}
}

/**
 * We ONLY want the interface exported, we don't want the module loaded
 */
declare global {
	interface IWindowManagerClient extends WindowManager {
		
	}
	
	function getWindowManager():IWindowManagerClient
}


// SET THE CLASS
instanceContainer.clazz = WindowManager

/**
 * Get the command manager from anywhere
 */
export const getWindowManager = getHot(module, 'getWindowManager', new Proxy(function () {
}, {
	apply: function (target, thisArg, args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => WindowManager


/**
 * Default export is the singleton getter
 */
export default getWindowManager


/**
 * Add getWindowManager onto the global scope
 */
assignGlobal({
	getWindowManager,
	instanceContainer: assign(instanceContainer, {
		hotInstance: instanceContainer.instance
	})
})


// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	if (instanceContainer.hotInstance) {
		Object.setPrototypeOf(instanceContainer.hotInstance, WindowManager.prototype)
	}
	
	// ON DISPOSE, SAVE getWindowManager
	setDataOnHotDispose(module, () => ({ getWindowManager }))

// ACCEPT SELF
	acceptHot(module, log)
}






