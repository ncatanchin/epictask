import Transport, {ITransportOptions, TransportScheme, TransportEvents} from "./Transport"
import {Counter} from "epic-global"
import { START_TIMEOUT_DEFAULT } from "./NetworkConfig"
import { makeIPCServerId } from "./IPCUtil"

const
	log = getLogger(__filename),
	IPC = require('node-ipc').IPC,
	processClientId = `epic-ipc-${ProcessConfig.getTypeName()}-${process.pid}`,
	instanceCounter = new Counter()




/**
 * IPCTransport
 *
 * @class IPCTransport
 * @constructor
 **/
export class IPCTransport extends Transport {
	
	/**
	 * IPC instance ref
	 */
	private ipc
	
	
	/**
	 * Client id for this instance
	 */
	private instanceClientId:string
	
	/**
	 * Connection resolver
	 */
	private connectDeferred
	
	/**
	 * Has the transport been disconnected
	 *
	 * @type {boolean}
	 */
	private disconnected = false
	
	
	/**
	 * Is the transport currently connected
	 *
	 * @returns {boolean}
	 */
	get connected() {
		return this.disconnected === false && this.connectDeferred && this.connectDeferred.promise.isResolved()
		
	}
	
	/**
	 * Get the client id for this instance
	 *
	 * @returns {string}
	 */
	get clientId() {
		return this.instanceClientId
	}
	
	/**
	 * Get the transport scheme
	 *
	 * @returns {TransportScheme}
	 */
	get scheme() {
		return TransportScheme.IPC
	}
	
	/**
	 * Return the event emitter that should
	 * be called with EventEmitter functions
	 *
	 * @returns {any}
	 */
	get eventEmitter() {
		return this.server
	}
	
	/**
	 * Get the IPC server
	 *
	 * @returns {any}
	 */
	get server() {
		return this.ipc.of[this.serverName]
	}
	
	/**
	 * get the IPC server name
	 *
	 * @returns {string}
	 */
	get serverName() {
		return makeIPCServerId(this.opts.hostname)
	}
	
	/**
	 * Create IPCTransport
	 */
	constructor(opts:ITransportOptions) {
		super(opts)
		
		
		this.instanceClientId = `${processClientId}-${instanceCounter.increment()}`
		this.ipc = new IPC
		
		
		assign(this.ipc.config, {
			id: this.instanceClientId,
			retry: 1500,
			silent: true
		})
		
	}
	
	/**
	 * Connect to IPC Server
	 */
	async connect():Promise<void> {
		if (this.connectDeferred)
			return this.connectDeferred.promise
		
		log.info(`Client ${processClientId} connecting to ${this.serverName}`)
		
		// Create the connect promise
		this.connectDeferred = Promise.defer()
		
		// Attach to the IPC server
		this.ipc.connectTo(this.serverName,() => {
			
			// Connect
			this.on(TransportEvents.Error,(err) => {
				log.error(`Error ${processClientId}`,err)
				// TODO: Implement backoff retry
				//this.connectDeferred.resolve(true)
			})
			
			// Connect
			this.on(TransportEvents.Connect,() => {
				log.info(`${processClientId} connected to ${this.serverName}`)
				this.disconnected = false
				this.connectDeferred.resolve(true)
			})
			
			// Disconnect
			this.on(TransportEvents.Disconnect,() => {
				log.info(`Disconnected ${processClientId}`)
				// if (!this.connectDeferred.promise.isResolved())
				// 	this.connectDeferred.reject(new Error('Connection failed'))
				//this.disconnected = true
			})
		})
		
		try {
			await this.connectDeferred
				.promise
				.timeout(START_TIMEOUT_DEFAULT)
		} catch (err) {
			log.error('Failed to connect',err)
			try {
				this.ipc.disconnect(this.serverName)
			} catch (err2) {}
			
			throw err
		}
	}
	
	/**
	 * Wait for connection initiation to complete
	 */
	async waitForConnection() {
		assert(!this.disconnected,'Connection is disconnected')
		
		await this.connect()
	}
	
	/**
	 * Disconnect from the IPC server
	 */
	disconnect() {
		log.warn(`Disconnecting from ${this.serverName}`)
		try {
			this.ipc.disconnect(this.serverName)
		} catch (err) {
			
			const sock = _.get(this.ipc.of[this.serverName],'socket') as any
			//log.warn('Disconnect failed, going to hard disconnect',sock ? 'got socket, so trying this': 'no socket - forget it')
			
			if (sock) {
				try {
					sock.destroy()
				} catch (err2) {
					log.warn('Socket destroy failed', err2)
				}
			}
			
		}
	}
	
}


export default IPCTransport
