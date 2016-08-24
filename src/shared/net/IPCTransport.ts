import Transport, {ITransportOptions, TransportScheme, TransportEvents} from "shared/net/Transport"

const
	log = getLogger(__filename),
	IPC = require('node-ipc').IPC,
	clientId = `client-${process.pid}`




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
	
	get clientId() {
		return clientId
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
		return this.opts.hostname
	}
	
	/**
	 * Create IPCTransport
	 */
	constructor(opts:ITransportOptions) {
		super(opts)
		
		this.ipc = new IPC
		
		assign(this.ipc.config, {
			id: clientId,
			retry: 1500
		})
		
	}
	
	/**
	 * Connect to IPC Server
	 */
	async connect():Promise<void> {
		if (this.connectDeferred)
			return this.connectDeferred.promise
		
		// Create the connect promise
		this.connectDeferred = Promise.defer()
		
		// Attach to the IPC server
		this.ipc.connectTo(this.serverName,() => {
			
			// Connect
			this.on(TransportEvents.Connect,() => {
				log.info(`Connected ${clientId}`)
				this.disconnected = false
				this.connectDeferred.resolve(true)
			})
			
			// Disconnect
			this.on(TransportEvents.Disconnect,() => {
				log.info(`Disconnected ${clientId}`)
				// if (!this.connectDeferred.promise.isResolved())
				// 	this.connectDeferred.reject(new Error('Connection failed'))
				this.disconnected = true
			})
		})
		
		try {
			await this.connectDeferred
				.promise
				.timeout(5000)
		} catch (err) {
			log.error('Failed to connect',err)
			try {
				this.ipc.disconnect()
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
		this.ipc.disconnect(this.serverName)
	}
	
}


export default IPCTransport
