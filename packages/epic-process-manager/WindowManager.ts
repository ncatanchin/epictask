import Electron from "epic-electron"

import {
	getHot,
	setDataOnHotDispose,
	acceptHot,
	shortId,
	getAppEntryHtmlPath,
	isString,
	isList,
	cloneObject,
	attachEvents,
	cloneObjectShallow,
	Events,
	getValue
} from "epic-global"
import {
	IWindowConfig,
	WindowType,
	DevToolsPositionDefault,
	IWindowInstance,
	IWindowState
} from "epic-process-manager-client/WindowTypes"
import { ProcessType } from "epic-entry-shared/ProcessType"
import { HEARTBEAT_TIMEOUT } from "epic-net"
import { SimpleEventEmitter } from "epic-global/SimpleEventEmitter"
import { WindowOptionDefaults } from "epic-process-manager-client/WindowConfig"
import { List } from "immutable"


const
	log = getLogger(__filename),
	
	windowStateKeeper = require('electron-window-state'),
	
	{BrowserWindow,app,ipcMain} = Electron,
	
	// Container to support hot reloading
	instanceContainer = ((global as any).instanceContainer || {}) as {
		clazz:typeof WindowManager,
		instance:WindowManager,
		hotInstance:WindowManager
	}

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Crate a window state keeper
 * 
 * @param id
 * @param config
 * @returns {any}
 */
function createWindowStateKeeper(id:string,config:IWindowConfig) {
	const
		{opts = {}} = config,
		{
			width:defaultWidth,
			height:defaultHeight
		} = opts
	
	
	return windowStateKeeper({
		file: `epic-window-state-${id}`,
		defaultWidth,
		defaultHeight
	})
}


/**
 * Window message handler
 */
export interface IWindowMessageHandler {
	(manager:WindowManager,instance:IWindowInstance,type:string,body?:any):any
}




/**
 * Append params to a url
 *
 * @param url
 * @param params
 * @returns {string}
 */
function appendURLParams(url:string,params:{[key:string]:any}) {
	return url + (url.includes('?') ? '&' : '?') +
		Object.keys(params)
			.map(key => `${key}=${encodeURIComponent(params[key])}`)
			.join('&')
		
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
		'heartbeatCount',
		'config',
		'window',
		'webContents',
		'onMessage'
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
			backgroundColor: require('epic-styles').getPalette().background
		},
		
		// TYPE DEFAULTS
		WindowOptionDefaults[ type ],
		
		// CONFIG DEFAULTS
		([ WindowType.Dialog, WindowType.Modal ].includes(type)) && {
			parent: BrowserWindow.getFocusedWindow()
		},
		
		// CUSTOM OPTS
		opts
	)
}
/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class WindowManager  {
	
	
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
		
		ipcMain.on(Events.ProcessMessage,this.onProcessMessage)
	}
	
	/**
	 * Handler for all process messages
	 *
	 * @param event
	 * @param type
	 * @param body
	 */
	private onProcessMessage = (event,type,body) => {
		const
			senderWebContents:Electron.WebContents = event.sender,
			win = this.getWindowInstance(senderWebContents)
		
		if (!win)
			return log.error(`Received a message on main from an unknown sender ${type}`,senderWebContents)
		
		win.onMessage(type,body)
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
	getWindowInstance(idOrContents:string|Electron.WebContents) {
		return this.windows.find(win => [win.id,win.webContents].includes(idOrContents))
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
	close(...idsOrNames:string[])
	/**
	 * Window instances
	 * @param windowInstances
	 */
	close(...windowInstances:IWindowState[])
	close(...idOrWindowInstances:Array<IWindowState|string>) {
		let
			
			// CREATE REMOVE LIST
			windowsToClose:IWindowInstance[] = this.windows.filter(it =>
				idOrWindowInstances.find(criteria => isString(criteria) ?
					
					// IF IDS OR CONFIG NAMES - MATCH
					[ it.id, it.config.uri,it.url ].includes(criteria) :
					
					// IF WINDOW INSTANCES
					(it === criteria || it.id === criteria.id)
				)
			)
		
		//log.debug(`Going to close windows`,windowsToClose,'from config',idOrWindowInstances)
		
		// ITERATE AND DESTROY/REMOVE
		while (windowsToClose.length) {
			const
				win:IWindowInstance = windowsToClose.shift(),
				index = this.windows.findIndex(it => it.id === win.id)
			
			log.debug(`Closing win`, win)
			
			try {
				if (win.window.isClosable()) {
					win.window.close()
				}
			} catch (err) {
				log.warn(`Unable to close window, probably destroyed`, err)
			}
			
			
			if (index > -1) {
				this.windows.splice(index, 1)
			}
		}
		
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
		app.emit(Events.WindowStatesChanged,this.getWindowStates())
	},150)
	
	/**
	 * Patch window state
	 *
	 * @param id
	 * @param patch
	 */
	private updateWindowState(id:string,patch:any) {
		const
			win = this.getWindowInstance(id)
		
		if (!win) {
			return log.warn(`Unknown window: ${id}`)
		}
		
		const
			index = this.windows.findIndex(it => it.id === win.id)
		
		this.windows[index] = cloneObjectShallow(win,patch)
		
		this.pushWindowStates()
		
	}
	
	/**
	 * On window exit
	 *
	 * @param id
	 * @param patch
	 */
	private onWindowExit(id:string,patch) {
		this.updateWindowState(
			id,
			assign(patch,{
				connected:false,
				running:false
			}))
		
		log.warn(`Window exited early we believe`,patch)
		
	}
	
	/**
	 * Is the worker currently running
	 *
	 * @returns {boolean}
	 */
	isRunning(id:string):boolean {
		const
			win = this.getWindowInstance(id)
		
		return getValue(() => win.window && !win.closed && !win.destroyed && !win.crashed && !win.killed)
	}
	
	
	/**
	 * Update heartbeat and schedule next
	 */
	private heartbeat(id:string) {
		const
			win = this.getWindowInstance(id)
		
		win.heartbeatCount++
		log.debug('Updating heartbeat',win.heartbeatCount)
		
		
		this.clearHeartbeatTimeout(id)
		win.heartbeatTimestamp = Date.now()
		this.scheduleHeartbeat(id)
	}
	
	/**
	 * Clear pending timeout
	 *
	 * @param id
	 */
	private clearHeartbeatTimeout(id:string) {
		const
			win = this.getWindowInstance(id)
		
		if (win.heartbeatTimeoutId) {
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
	sendMessage(id,type:string, body:any = {}, callback?:(err:Error) => void) {
		if (!this.isRunning(id)) {
			return log.error(`Process is not ready for messages ${id}/${type}`)
		}
		
		const
			win = this.getWindowInstance(id)
		
		log.debug(`Sending Message (${type})`)
		
		win.webContents.send('message',{type,body})
	}
	
	
	/**
	 * Schedule next heartbeat
	 */
	private scheduleHeartbeat(id:string) {
		const
			win = this.getWindowInstance(id)
		
		if (this.isRunning(id)) {
			win.heartbeatTimeoutId = global.setTimeout(() => this.sendHeartbeat(id),HEARTBEAT_TIMEOUT)
		}
	}
	
	/**
	 * Send heartbeat message
	 */
	private sendHeartbeat(id:string) {
		this.clearHeartbeatTimeout(id)
		
		if (!this.isRunning(id))
			return
		
		const
			win = this.getWindowInstance(id)
		
		
		this.sendMessage(id,'ping')
		this.scheduleHeartbeat(id)
	}
	
	/**
	 * Create ipc message handler
	 * @param id
	 * @returns {(type:any, message:any)=>undefined}
	 */
	private makeOnIpcMessage(id) {
		return (type,body) => {
			
			const
				win = this.getWindowInstance(id)
			
			switch (type) {
				case 'pong':
					if (!win.connectedFlag.promise.isResolved())
						win.connectedFlag.resolve(true)
					
					this.heartbeat(id)
					break
				default:
					this.messageEmitter.emit(this,win,type,body)
			}
		}
	}
	
	/**
	 * Completes connection to client webview
	 */
	private makeConnect(id:string) {
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
					
					// Wrap retry to clear id
					win.heartbeatTimeoutId = setTimeout(() => {
						this.clearHeartbeatTimeout(id)
						tryConnection()
					}, 100)
				}
				
				
				win = this.getWindowInstance(id)
				
				if (!win.heartbeatTimeoutId && this.isRunning(id) && !win.connectedFlag.promise.isPending()) {
					
					this.sendMessage(id,'ping', null, (err) => {
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
			
			return await Promise.all(configs.map(it => this.open(it)))
		}
		
		const
			config:IWindowConfig = cloneObject(configOrConfigs) as IWindowConfig
		
		let
			{opts = {}} = config
		
		const
			windowCreateDeferred = Promise.defer(),
			
			{
				type,
				uri,
				storeWindowState = false,
				singleWindow = false,
				autoRestart = false,
				showDevTools = true,
				processType = ProcessType.UI
			} = config
		
		assert(!singleWindow || !this.windows.find(it => it.config.name === config.name),
			`Window ${config.name} is marked as a single instance, but there is already one open` )
			
		
		try {
			
			const
				newWindowOpts = makeBrowserWindowOptions(type,opts)
			
			// ID IS NAME FOR SINGLE WINDOWS
			const
				id = config.id  || (singleWindow ? config.name : shortId())
			
			// IF STORE STATE ENABLED, CREATE STATE MANAGER
			let
				savedWindowState = storeWindowState  && createWindowStateKeeper(id,config) 
					
			
			// TODO: REMOVE - TEST
			
			// CREATE WINDOW AND GET TO WORK
			const
				newWindow = new Electron.BrowserWindow(Object.assign({}, newWindowOpts,savedWindowState)),
				templateURL = getAppEntryHtmlPath()
			
			let
				url = appendURLParams(`file://${templateURL}#${uri}`,{
					EPIC_ENTRY: ProcessConfig.getTypeName(processType),
					EPIC_WINDOW_ID: id
				})
			
			
			const
				windowInstance = this.windows[ this.windows.length ] = cloneObjectShallow(config,{
					id,
					type,
					opts: newWindowOpts as any,
					uri,
					url,
					autoRestart,
					destroyed:false,
					crashed:false,
					closed:false,
					unresponsive:false,
					focused:false,
					visible:false,
					killed: false,
					running: true,
					connected: false,
					
					heartbeatTimestamp:0,
					heartbeatCount:0,
					window: newWindow,
					
					onMessage: this.makeOnIpcMessage(id),
					connectedFlag: windowCreateDeferred,
					config
				}) as IWindowInstance
			
			
			process.on('beforeExit',() => {
				try {
					newWindow.close()
				} catch (err) {}
			})
			
			// IF WE HAVE A WINDOW STATE MANAGER THEN GO TO WORK
			if (savedWindowState) {
				savedWindowState.manage(newWindow)
			}
			
			log.debug(`Loading dialog ${id} with URL:`, url)
			newWindow.loadURL(url)
			
			
			// OPEN DEV TOOLS IF CONFIGURED
			if (DEBUG &&  showDevTools) {
				newWindow.show()
				newWindow.webContents.openDevTools({
					mode: DevToolsPositionDefault
				})
			}
			
			
			// EVENTS
			const
				makeOnFocus = (focused:boolean) => () => this.updateWindowState(id,{focused}),
				makeOnUnresponsive = (unresponsive:boolean) => () => this.updateWindowState(id,{unresponsive}),
				makeOnShow = (shown:boolean) => () => this.updateWindowState(id,{visible:shown})
				
			newWindow.on('close',(event) => {
				log.info(`Window closed: ${id}`)
				this.updateWindowState(id,{closed:true})
			})
			
			attachEvents(log,newWindow,{
				responsive: makeOnUnresponsive(false),
				unresponsive:makeOnUnresponsive(true),
				focus:makeOnFocus(true),
				blur:makeOnFocus(false),
				show:makeOnShow(true),
				hide:makeOnShow(false)
			})
			
			
			newWindow.once('ready-to-show', () => {
				log.debug(`Ready to show for window ${id}`)
				newWindow.show()
				newWindow.focus()
			})
			
			
			// newWindow.on('close', () => {
			// 	log.debug(`Window closed ${id}`)
			//
			// 	// REMOVE THE WINDOW
			// 	this.close(id)
			// })
			
			// SET WEB-CONTENTS
			const
				{webContents} = newWindow
			
			assign(windowInstance,{webContents})
			
			// WEB-CONTENTS EVENTS
			const
				onNavigate = (event, url) => this.updateWindowState(id,{url})
			
			attachEvents(log,webContents,{
				'did-navigate': onNavigate,
				'did-navigate-in-page': onNavigate,
				'ipc=-message': windowInstance.onMessage,
				'dom-ready': this.makeConnect(id),
				crashed: (event, killed) => this.onWindowExit(id,{crashed:true,killed:true}),
				destroyed: () => this.onWindowExit(id,{destroyed:true}),
			})
			windowCreateDeferred.resolve(windowInstance)
			
		} catch (err) {
			windowCreateDeferred.reject(err)
		}
		
		return windowCreateDeferred
			.promise
			.timeout(60000)
		
	}
}

/**
 * We ONLY want the interface exported, we don't want the module loaded
 */
export interface IWindowManagerClient extends WindowManager {
	
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
	setDataOnHotDispose(module, () => ({getWindowManager}))

// ACCEPT SELF
	acceptHot(module, log)
}






