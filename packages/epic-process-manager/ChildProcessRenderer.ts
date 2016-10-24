

import Electron = require('electron')

import { ProcessType } from "epic-global"
import {ChildProcessManager as ChildProcessManagerType} from './ChildProcessManager'
import { getAppEntryHtmlPath } from  "epic-common"
import { HEARTBEAT_TIMEOUT, START_TIMEOUT_DEFAULT } from "epic-net"
import { setDataOnHotDispose, getHot } from  "epic-common"


const
	
	log = getLogger(__filename),
	windowStateKeeper = require('electron-window-state'),
	globalListeners:IChildProcessEventListener[] = getHot(module,'globalListeners',[]),
	{ipcRenderer,BrowserWindow} = require('electron')

setDataOnHotDispose(module,() => ({
	globalListeners
}))

/**
 * Add a listener to the worker
 *
 * @param listener
 */
export function addGlobalListener(listener:IChildProcessEventListener) {
	if (!globalListeners.includes(listener))
		globalListeners.push(listener)
	
	return function() {
		removeGlobalListener(listener)
	}
}

/**
 * Remove event listener
 *
 * @param listener
 */
export function removeGlobalListener(listener:IChildProcessEventListener) {
	const index = this.listeners.indexOf(listener)
	if (index > -1)
		this.listeners.splice(index,1)
}

export interface IChildProcessMessage {
	type:string
	body?:any
}

export type TChildProcessMessageEventCallback = (childProcess:ChildProcessRenderer, message:IChildProcessMessage) => void

export type TChildProcessEventCallback = (childProcess:ChildProcessRenderer, err:Error, data?:any) => void

export interface IChildProcessEventListener {
	onError?:TChildProcessEventCallback
	onMessage?:TChildProcessMessageEventCallback
	onStart?:TChildProcessEventCallback
	onStop?:TChildProcessEventCallback
}

/**
 * Options that can be passed into a new worker
 */
export interface IWorkerOptions {
	startTimeoutMillis?:number
	env?:any
}

/**
 * Worker - manages spawned and forked processes
 */
export default class ChildProcessRenderer {
	
	/**
	 * All worker event listeners
	 */
	private listeners:IChildProcessEventListener[]
	
	
	/**
	 * Reference to child process
	 */
	//private webView:WebViewElement
	private browserWindow:Electron.BrowserWindow
	
	/**
	 * Jquery WebView wrapper
	 */
	//private webViewElem:JQuery
	
	/**
	 * Deferred stop flag
	 */
	private stopDeferred:Promise.Resolver<any>
	
	/**
	 * Process is created
	 *
	 * @type {boolean}
	 */
	private created = false
	
	/**
	 * Process sent exit
	 *
	 * @type {boolean}
	 */
	private exited = false
	
	/**
	 * Process is killed
	 *
	 * @type {boolean}
	 */
	private killed = false
	
	/**
	 * Internal flag to resolve running
	 */
	private runningFlag = Promise.defer()
	
	/**
	 * Ref to current timeout
	 */
	private tryTimeoutId
	
	/**
	 * Last heartbeat timestamp
	 *
	 * @type {number}
	 */
	private heartbeatTimestamp = 0
	
	/**
	 * Number of heartbeats received (pongs)
	 *
	 * @type {number}
	 */
	public heartbeatCount = 0
	
	/**
	 * Heartbeat timeout id
	 */
	private heartbeatTimeoutId = null
	
	/**
	 * Clear pending heartbeat request
	 */
	private clearHeartbeatTimeout() {
		if (this.heartbeatTimeoutId) {
			clearTimeout(this.heartbeatTimeoutId)
			this.heartbeatTimeoutId = null
		}
	}
	
	private clearTryTimeout() {
		if (this.tryTimeoutId) {
			clearTimeout(this.tryTimeoutId)
			this.tryTimeoutId = null
		}
	}
	
	/**
	 * Schedule next heartbeat
	 */
	private scheduleHeartbeat() {
		this.clearHeartbeatTimeout()
		
		if (this.running) {
			this.heartbeatTimeoutId = setTimeout(this.sendHeartbeat.bind(this),HEARTBEAT_TIMEOUT)
		}
	}
	
	/**
	 * Update heartbeat and schedule next
	 */
	private heartbeat() {
		this.heartbeatCount++
		log.debug('Updating heartbeat',this.heartbeatCount)
		this.clearHeartbeatTimeout()
		this.heartbeatTimestamp = Date.now()
		this.scheduleHeartbeat()
	}
	
	/**
	 * Send heartbeat message
	 */
	private sendHeartbeat() {
		if (this.killed || !this.browserWindow || !this.running)
			return
		
		this.sendMessage('ping')
		this.scheduleHeartbeat()
	}
	
	/**
	 * Is the worker currently running
	 *
	 * @returns {boolean}
	 */
	get running():boolean {
		return !this.killed && this.runningFlag.promise.isResolved()
	}
	
	/**
	 * Worker constructor
	 *
	 * @param manager
	 * @param name
	 * @param processType
	 * @param opts
	 * @param listeners
	 */
	constructor(
		public manager:typeof ChildProcessManagerType,
		public name:string,
		public processType:ProcessType,
		private opts:IWorkerOptions = {},
		...listeners:IChildProcessEventListener[]
	) {
		this.listeners = listeners
	}
	
	
	/**
	 * Add a listener to the worker
	 *
	 * @param listener
	 */
	addListener(listener:IChildProcessEventListener) {
		if (!this.listeners.includes(listener))
			this.listeners.push(listener)
	}
	
	/**
	 * Remove event listener
	 *
	 * @param listener
	 */
	removeListener(listener:IChildProcessEventListener) {
		const index = this.listeners.indexOf(listener)
		if (index > -1)
			this.listeners.splice(index,1)
	}
	
	/**
	 * Check to see if we should restart
	 */
	checkRestart() {
		const
			shouldRestart = false//this.manager.isRunning()
		
		if (!shouldRestart)
			return
		
		log.info(`Preparing to restarting child process`,this)
		
		// this.clearHeartbeatTimeout()
		// this.clearTryTimeout()
		//
		// Object.assign(this,{
		// 	startDeferred: null,
		// 	stopDeferred:null,
		// 	killed: false,
		// 	created: false,
		// 	exited: false,
		// 	browserWindow: null,
		// 	heartbeatCount: 0,
		// 	heartbeatTimestamp: 0,
		// 	runningFlag: Promise.defer()
		// })
		//
		// log.info(`Restarting child process`,this)
		// this.start()
	}
	
	
	/**
	 * Handle worker errors
	 *
	 * @param event
	 */
	private handleError = (event) => {
		log.error(`Error received ${this.name}`,event)
		this.listeners.forEach(listener => {
			try {
				listener.onError && listener.onError(this, new Error(event.errorDescription))
			} catch (err2) {
				log.error(`On error listener had an error - kind of funny`,err2)
			}
		})
	}
	
	private handleCrash = (event) => {
		log.error(`Child crashed`,event)
		this.handleExit(event)
	}
	
	private handleClose = (event) => {
		log.info(`Child closed ${this.processType}`)
		this.browserWindow = null
		
		this.handleExit(event)
		// this.cleanup()
		// this.checkRestart()
		
	}
	
	/**
	 * Handle process exit/stop
	 *
	 * @param event
	 */
	private handleExit = (event = null) => {
		//const err:Error, isDisconnect = false
		try {
			this.exited = true
			
			this.listeners.forEach(listener => {
				try {
					listener.onStop && listener.onStop(this, null)
				} catch (err2) {
					log.error('On exit error in listener', err2)
				}
			})
			
			// If not set, then set it
			if (!this.stopDeferred) {
				
				// If this is a disconnect, and not killed, then kill
				if (!this.killed && this.browserWindow) {
					log.warn('Unexpected disconnect, killing manually')
					try {
						//this.webView.delete()
						this.browserWindow.close()
						this.browserWindow = null
					} catch (err2) {
						log.error('Manual kill failed', err2)
					}
				}
				this.cleanup()
				this.killed = true
				
				this.stopDeferred = Promise.defer()
				this.stopDeferred.resolve()
				
			} else if (!this.stopDeferred.promise.isResolved())
				this.stopDeferred.resolve()
			
			this.cleanup()
		} catch (err) {
			log.error(`Failed to stop cleanly`)
		}
		
		this.checkRestart()
	}
	
	//noinspection JSUnusedLocalSymbols
	/**
	 * Re-mapped console message handler - usually not enabled
	 *
	 * @param args
	 */
	private handleConsoleMessage = (...args) => {
		console.log(`Child message from type ${this.name}`,...args)
	}

	/**
	 * Handle message
	 *
	 * @param type
	 * @param body
	 */
	handleMessage = (type,body) => {
		
		// HANDLE INTERNALLY FIRST - IF NO DEFAULT HANDLER - PASS TO REGISTERED HANDLERS
		switch (type) {
			
			// Ping <> Pong
			case 'pong':
				// If not marked running yet then mark it
				if (!this.runningFlag.promise.isResolved()) {
					this.runningFlag.resolve(true)
				}
				
				// Update the heartbeat and schedule next
				this.heartbeat()
				break
			
			// Registered handlers
			default:
				[...this.listeners,...globalListeners].forEach(listener =>
					listener.onMessage && listener.onMessage(this,body))
		}
	}
	
	/**
	 * Process cleanup
	 */
	private cleanup() {
		this.clearHeartbeatTimeout()
		
		if (this.killed)
			return
		
		this.killed = true
		
		// Grab the ref
		const {browserWindow} = this
		
		
		
		// If already killed or never started!
		if (!browserWindow) {
			log.warn('not running, can not kill',this.name,this.processType)
		} else {
			
			// Send kill
			try {
				if (!this.exited) {
					//webView.delete()
					browserWindow.close()
					//child.kill()
				}
			} catch (err) {
				log.error('Child kill failed', err)
			}
			
			// Clear ref
			this.browserWindow = null
		}
		
		// Make sure we complete the stop
		if (this.stopDeferred && !this.stopDeferred.promise.isResolved())
			this.stopDeferred.resolve()
	}
	
	
	
	/**
	 * Kill the worker
	 */
	kill() {
		if (!this.killed) {
			this.killed = true
			
			const {browserWindow} = this
			
			if (browserWindow) {
				try {
					//browserWindow.delete()
					browserWindow.close()
					this.browserWindow = null
				} catch (err) {
					log.warn(`Failed to send kill to child`,err)
				}
			}
			
			this.cleanup()
		}
	}
	
	/**
	 * Send a message to child
	 *
	 * @param type
	 * @param body
	 * @param callback
	 */
	sendMessage(type:string, body:any = {}, callback?:(err:Error) => void) {
		if (this.killed || !this.browserWindow) {
			throw new Error(`Process is not ready for messages (killed=${this.killed})`)
		}
		
		log.debug(`Sending Message (${type})`)
		
		// Send the actual message
		//this.browserWindow.send('message',{type,body})
		this.browserWindow.webContents.send('message',{type,body})
	}
	
	/**
	 * Stop the worker
	 */
	stop(exitCode = 0):Promise<any> {
		if (this.exited || this.killed || this.stopDeferred || !this.browserWindow)
			return
		
		this.stopDeferred = Promise.defer()
		try {
			if (this.browserWindow.isClosable())
				this.browserWindow.close()
			else
				this.browserWindow.destroy()
		} catch (err) {
			log.error(`Failed to cleanly stop window`, err)
		}
		this.browserWindow = null
		
		return this.stopDeferred.promise
	}
	
	
	/**
	 * If should show the window - then show it
	 */
	private showIfEnabled = () => {
		if (ProcessConfig.showChildDevTools(this.processType)) {
			log.info(`Opening dev tools for child process`,this.name)
			this.browserWindow.show()
			this.browserWindow.webContents.openDevTools()
		}
	}
	
	
	/**
	 * Completes connection to client webview
	 */
	private connectToChild = () => {
		this.showIfEnabled()
		
		// Setup communications verification
		let
			tryCount = 0
			
		this.tryTimeoutId = null
		
		const tryConnection = () => {
			tryCount++
			
			log.info(`Communication attempt #${tryCount}`)
			
			const retry = () => {
				// Try again in a sec
				if (this.tryTimeoutId)
					clearTimeout(this.tryTimeoutId)
				
				// Wrap retry to clear id
				this.tryTimeoutId = setTimeout(() => {
					this.tryTimeoutId = null
					tryConnection()
				},100)
			}
			
			if (!this.tryTimeoutId && !this.running && !this.killed) {
				
				this.sendMessage('ping', null, (err) => {
					if (err) {
						log.info('Can not send message to worker',err)
					}
				})
			}
			
			retry()
		}
		
		tryConnection()
	}
	
	/**
	 * Start the worker
	 *
	 * @returns {Promise}
	 */
	async start() {
		if (this.browserWindow || this.created)
			throw new Error(`Worker already started (created=${this.created})`)
	
		try {
			
			const
				processTypeName = ProcessConfig.getTypeName(this.processType) || 'unknown',
				childWindowState = windowStateKeeper({
					defaultWidth: 1024,
					defaultHeight: 728,
					file: `child-window-${processTypeName}`
				}),
				templateURL = getAppEntryHtmlPath(),
				url = `file://${templateURL}#EPIC_ENTRY=${processTypeName}`
			
			
			this.browserWindow = new BrowserWindow(Object.assign({
				show:false,
				webPreferences: {
					partition: `child-${processTypeName}`
				}
			},childWindowState))
			
			// ATTACH STATE HANDLER
			childWindowState.manage(this.browserWindow)
			
			// Assign handlers
			this.browserWindow
				// WHEN READY TO SHOW - IF SHOULD SHOW DEVTOOLS THEN SHOW WINDOW
				.once('ready-to-show',this.showIfEnabled)
				.on('close',this.handleClose)
				.webContents
				.on('did-fail-load',this.handleError)
				.on('did-finish-load',() => {
					log.info(`Web page loaded and is ready`)
					if (!this.runningFlag.promise.isResolved())
						this.runningFlag.resolve()
				})
				.on('destroyed',this.handleExit)
				.on('dom-ready', this.connectToChild)
				.on('ipc-message',this.handleMessage)
			
			this.browserWindow.loadURL(url)
			// this.webView.addEventListener('console-message',this.handleConsoleMessage)
			
			
			process.on('beforeExit',() => {
				try {
					this.browserWindow.close()
				} catch (err) {}
			})
				
			
			// 1-tick
			await Promise.setImmediate()
				
			// Send ping
			if (this.killed) {
				log.warn('Killed before start')
				return true
			}
			
			
			
			// Wait for the 'pong'
			try {
				await Promise
					.resolve(this.runningFlag.promise)
					.timeout(this.opts.startTimeoutMillis || START_TIMEOUT_DEFAULT)
				
				log.info(`Child is RUNNING / ${this.name}`)
				
				
				
				this.heartbeat()
			} finally {
				if (this.tryTimeoutId) {
					clearTimeout(this.tryTimeoutId)
				}
			}
			
		} catch (err) {
			log.error('Failed to start process',err)
			throw err
		}
		
	}
	
	
}