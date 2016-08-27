import * as childProcess from 'child_process'
import {getAppConfig} from "shared/AppConfig"
//import {ELECTRON_PATH} from 'shared/util/ElectronUtil'

const HEARTBEAT_TIMEOUT = 1000
const START_TIMEOUT_DEFAULT = 5000

const log = getLogger(__filename)



export interface IWorkerMessage {
	type:string
	body?:any
}

export type TWorkerMessageEventCallback = (worker:Worker,message:IWorkerMessage) => void

export type TWorkerEventCallback = (worker:Worker,err:Error,data?:any) => void

export interface IWorkerEventListener {
	onError?:TWorkerEventCallback
	onMessage?:TWorkerMessageEventCallback
	onStart?:TWorkerEventCallback
	onStop?:TWorkerEventCallback
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
export default class Worker {
	
	/**
	 * All worker event listeners
	 */
	private listeners:IWorkerEventListener[]
	
	
	/**
	 * Reference to child process
	 */
	private child:childProcess.ChildProcess
	
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
		if (this.killed || !this.child || !this.running)
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
	 * @param startFile
	 * @param name
	 * @param opts
	 * @param listeners
	 */
	constructor(private startFile:string, public name:string, private opts:IWorkerOptions = {}, ...listeners:IWorkerEventListener[]) {
		this.listeners = listeners
	}
	
	
	/**
	 * Add a listener to the worker
	 *
	 * @param listener
	 */
	addListener(listener:IWorkerEventListener) {
		if (!this.listeners.includes(listener))
			this.listeners.push(listener)
	}
	
	/**
	 * Remove event listener
	 *
	 * @param listener
	 */
	removeListener(listener:IWorkerEventListener) {
		const index = this.listeners.indexOf(listener)
		if (index > -1)
			this.listeners.splice(index,1)
	}
	
	/**
	 * Handle worker errors
	 *
	 * @param err
	 */
	private handleError = (err:Error) => {
		this.listeners.forEach(listener => {
			try {
				listener.onError && listener.onError(this, err)
			} catch (err2) {
				log.error(`On error listener had an error - kind of funny`,err2)
			}
		})
	}
	
	/**
	 * Handle process exit/stop
	 *
	 * @param err
	 * @param isDisconnect
	 */
	private handleExit = (err:Error, isDisconnect = false) => {
		log.info(`Exit called - isDisconnect(${isDisconnect})`,err)
		this.exited = true
		
		this.listeners.forEach(listener => {
			try {
				listener.onStop && listener.onStop(this, err)
			} catch (err2) {
				log.error('On exit error in listener', err2)
			}
		})
		
		// If not set, then set it
		if (!this.stopDeferred) {
			
			// If this is a disconnect, and not killed, then kill
			if (isDisconnect && !this.killed && this.child) {
				log.warn('Unexpected disconnect, killing manually')
				try {
					this.child.kill()
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
	}
	
	
	
	
	/**
	 * Basically a curried handleExit call
	 *
	 * @param err
	 */
	private handleDisconnect = (err:Error) => {
		log.info('Disconnect received',err)
		//this.handleExit(err,true)
	}
	
	/**
	 * Basically a curried handleExit call
	 *
	 * @param err
	 */
	private handleClosed = (err:Error) => {
		log.info('Closed received',err)
		this.handleExit(err,true)
	}
	
	/**
	 * Handle message
	 *
	 * @param message
	 */
	private handleMessage = (message:IWorkerMessage) => {
		// First handle message internally
		switch (message.type) {
			
			
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
				this.listeners.forEach(listener =>
				listener.onMessage && listener.onMessage(this,message))
		}
		
		
	}
	
	
	private cleanup() {
		if (this.killed)
			return
		
		this.killed = true
		
		// Grab the ref
		const {child} = this
		
		
		
		// If already killed or never started!
		if (!child) {
			log.warn('not running, can not kill',this.startFile)
		} else {
			
			// We should be connected
			if (child.connected) {
				log.info('closing ipc')
				child.disconnect()
			} else {
				log.warn('We are not connected to the child - weird')
			}
			
			
			// Remove listeners
			try {
				child.removeAllListeners()
			} catch (err) {
				log.warn('Failed to remove all listeners', err.message)
			}
			
			// Send kill
			try {
				if (!this.exited)
					child.kill()
			} catch (err) {
				log.error('Child kill failed', err)
			}
			
			// Clear ref
			this.child = null
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
			
			const child = this.child
			
			if (child) {
				try {
					child.kill()
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
		if (this.killed || !this.child) {
			throw new Error(`Process is not ready for messages (killed=${this.killed})`)
		}
		
		log.debug(`Sending Message (${type})`)
		
		// Send the actual message
		const child = this.child as any
		child.send({type, body},null,callback)
	}
	
	/**
	 * Stop the worker
	 */
	stop(exitCode = 0):Promise<any> {
		if (this.exited || this.killed || this.stopDeferred || !this.child)
			return
		
		this.stopDeferred = Promise.defer()
		this.kill()
		
		return this.stopDeferred.promise
	}
	
	/**
	 * Start the worker
	 *
	 * @returns {Promise<T>|Promise}
	 */
	async start() {
		if (this.child || this.created)
			throw new Error(`Worker already started (created=${this.created})`)
	
		try {
			
			
			// Create the process
			const
				args = process.argv,
				execArgs = process.execArgv
			
			let debugArgs = args.slice(1).filter(arg => arg.indexOf('debug') > -1)
			
			/**
			 * Child options
			 *
			 * @type {{stdio: (string|string)[]}}
			 */
			const opts = {
				stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
				env: Object.assign(
					{},
					process.env,
					this.opts.env || {},
					{
						EPIC_CHILD: true,
						EPIC_CONFIG: JSON.stringify(getAppConfig())
					}
				)
			}
			
			
			log.info('Main args are',args,'debugArgs',debugArgs,'execArgs',execArgs)
			const child = this.child = childProcess.fork(this.startFile,[],opts)
			
			// Immediately attach kill on death
			process.on('exit', (code) => {
				try {
					this.kill()
				} catch (err) {
				}
			})
			//this.child = childProcess.spawn(ELECTRON_PATH,[this.startFile],opts)
			
			
			// Assign handlers
			child
				.on('disconnect',this.handleDisconnect)
				.on('error',this.handleError)
				.on('exit',this.handleExit)
				.on('message',this.handleMessage)
			
			
			// 1-tick
			await Promise.setImmediate()
				
			// Send ping
			if (this.killed) {
				log.warn('Killed before start')
				return true
			}
			
			// Setup communications verification
			let tryCount = 0
			let tryTimeoutId = null
			
			const tryConnection = () => {
				tryCount++
				
				log.info(`Communication attempt #${tryCount}`)
				
				function retry() {
					// Try again in a sec
					if (tryTimeoutId)
						clearTimeout(tryTimeoutId)
					
					// Wrap retry to clear id
					tryTimeoutId = setTimeout(() => {
						tryTimeoutId = null
						tryConnection()
					},100)
				}
				
				if (!tryTimeoutId && !this.running && !this.killed) {
					this.sendMessage('ping', null, (err) => {
						if (err) {
							log.info('Can not send message to worker',err)
						}
					})
				}
				
				retry()
				
			}
			
			tryConnection()
			
			// Wait for the 'pong'
			try {
				await Promise
					.resolve(this.runningFlag.promise)
					.timeout(this.opts.startTimeoutMillis || START_TIMEOUT_DEFAULT)
				
				log.info('Worker is RUNNING')
				
				this.heartbeat()
			} finally {
				if (tryTimeoutId) {
					clearTimeout(tryTimeoutId)
				}
			}
			
		} catch (err) {
			log.error('Failed to start process',err)
			throw err
		}
		
	}
	
	
}