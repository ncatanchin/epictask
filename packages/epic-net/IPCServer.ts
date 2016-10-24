
import { cloneObject } from  "epic-common"
import { makeIPCServerId } from "./IPCUtil"
const
	log = getLogger(__filename),
	IPC = require('node-ipc').IPC
	//ipc = require('node-ipc')

// ipc.config.id = ProcessConfig.getTypeName()
// ipc.config.retry = 1500
// ipc.config.silent = true

/**
 * Handler shape
 */
export type TIPCEventHandler = (server:IPCServer,socket,event,request) => any

export type TIPCEventHandlers = {[event:string]:TIPCEventHandler}


/**
 * IPC Server
 */
export class IPCServer {
	
	// ipc server ref
	private ipc
	
	private startDeferred:Promise.Resolver<any>
	
	/**
	 * IPC Server Id
	 */
	readonly name:string
	
	constructor(name:string,private handlers:TIPCEventHandlers) {
		this.name = makeIPCServerId(name)
	}
	
	
	private cleanup() {
		try {
			// Stop ipc server
			this.ipc.server && this.ipc.server.stop && this.ipc.server.stop()
		} catch (err) {
			log.error(`Cleanup failed`,err)
		} finally {
			this.ipc = null
			this.startDeferred = null
		}
	}
	
	
	/**
	 * Send data to a socket
	 *
	 * @param socket
	 * @param event
	 * @param data
	 */
	send(socket,event,data) {
		try {
			this.ipc.server.emit(socket, event, data)
		} catch (err) {
			log.error(`Failed to send`,event,data,socket,err)
		}
	}
	
	/**
	 * Broadcast event
	 *
	 * @param event
	 * @param data
	 */
	broadcast(event,data) {
		this.ipc.server.broadcast(event,data)
	}
	
	/**
	 * Start the server
	 *
	 * @returns {Promise<any>}
	 */
	async start() {
		if (this.startDeferred)
			return this.startDeferred.promise
		
		log.info(`Starting IPC Server: "${this.name}"`)
		
		const
			startDeferred = this.startDeferred = Promise.defer()
			
		const ipc = this.ipc = new IPC
		
		assign(this.ipc.config,{
			id: this.name,
			retry: 1500,
			silent: true
		})
		
		// Configure IPC Server
		ipc.serve(() => {
			Object.keys(this.handlers).forEach(event => {
				
				log.debug(`Registering handler ${event}`)
				const
					handler = this.handlers[event]
				
				ipc.server.on(event,(request, socket) => {
					log.debug(`Received event`,event,request,socket)
					handler(this,socket,event,cloneObject(request))
				})
			})
			
			// Notify StateServer
			log.info('IPC Server is ready - notifying worker owner')
			Promise.delay(2000).then(() => {
				startDeferred.resolve()
			})
			
		})
		
		//Start IPC Server
		ipc.server.start()
		
		return this.startDeferred
			.promise
			.timeout(10000,`Timed out starting ${this.name}`)
			.catch((err) => {
				log.error(`Failed to start ipc server ${this.name}`,err)
				this.cleanup()
				
				throw err
			})
		
	}
	
	/**
	 * Stop the server
	 *
	 * @returns {Promise<void>}
	 */
	async stop() {
		log.info(`Stopping IPC server ${this.name}`)
		this.cleanup()
		
		return Promise.resolve()
	}
	
	
	
}


