import * as childProcess from 'child_process'
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
	 * Process is created
	 *
	 * @type {boolean}
	 */
	private created = false
	
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
	 * @param opts
	 * @param listeners
	 */
	constructor(private startFile:string, private opts:IWorkerOptions = {}, ...listeners:IWorkerEventListener[]) {
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
		this.listeners.forEach(listener =>
			listener.onError && listener.onError(this,err))
	}
	
	/**
	 * Handle process exit/stop
	 *
	 * @param err
	 */
	private handleExit = (err:Error) => {
		this.listeners.forEach(listener =>
			listener.onStop && listener.onStop(this,err))
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
	
	/**
	 * Kill the worker
	 */
	kill() {
		this.killed = true
		
		// Grab the ref
		const {child} = this
		
		// If already killed or never started!
		if (!child) {
			log.warn('not running, can not kill',this.startFile)
			return
		}
		
		// We should be connected
		if (child.connected) {
			log.info('closing ipc')
			child.disconnect()
		} else {
			log.warn('We are not connected to the child - weird')
		}
		
		
		// Remove listeners
		child.removeListener('error',this.handleError)
		child.removeListener('exit',this.handleExit)
		child.removeListener('message',this.handleMessage)
		
		// Send kill
		child.kill()
		
		// Clear ref
		this.child = null
		
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
		
		log.info(`Sending Message (${type})`)
		
		// Send the actual message
		const child = this.child as any
		child.send({type, body},null,callback)
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
				env: Object.assign({},process.env,this.opts.env || {})
			}
			
			
			log.info('Main args are',args,'debugArgs',debugArgs,'execArgs',execArgs)
			const child = this.child = childProcess.fork(this.startFile,[],opts)
			
			// Immediately attach kill on death
			process.on('exit', (code) => {
				try {
					child.kill()
				} catch (err) {
				}
			})
			//this.child = childProcess.spawn(ELECTRON_PATH,[this.startFile],opts)
			
			
			// Assign handlers
			child
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