import * as  msgpack from 'msgpack-lite'
import {isString} from 'typeguard'
import {Counter} from "epic-global"
import Transport, {ITransportOptions, TransportScheme, TransportEvents} from "./Transport"
import { START_TIMEOUT_DEFAULT } from "./NetworkConfig"
import { makeIPCServerId } from "./IPCUtil"
import IPCBufferedMessage,{ makeIPCMsgPackReadStream } from "./IPCBufferedMessage"

const
	log = getLogger(__filename),
	IPC = require('node-ipc').IPC,
	processClientId = `epic-ipc-${ProcessConfig.getTypeName()}-${process.pid}`,
	instanceCounter = new Counter()

//log.setOverrideLevel(LogLevel.DEBUG)

export interface IIPCTransportOptions extends ITransportOptions {
	raw?:boolean
}


/**
 * IPCTransport
 *
 * @class IPCTransport
 * @constructor
 **/
export class IPCTransport extends Transport {
	
	
	bufferedMessage:IPCBufferedMessage
	
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
	
	private raw = false
	
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
	
	
	onData = (noop,data) => {
		try {
			const
				{ type, msg } = data
			
			try {
				this.listeners(type).forEach(listener => listener(msg))
				
			} catch (err) {
				log.error(`Failed to emit ${type}`,err)
			}
			
		} catch (err) {
			log.error(`Failed to decode buf`, err)
		}
	}
	
	dataStream = makeIPCMsgPackReadStream(this.onData)
	
	/**
	 * Create IPCTransport
	 */
	constructor(opts:IIPCTransportOptions) {
		super(opts)
		
		this.raw = opts.raw === true
		
		this.instanceClientId = `${processClientId}-${instanceCounter.increment()}`
		this.ipc = new IPC
		
		
		assign(this.ipc.config, {
			id: this.instanceClientId,
			retry: 1500,
			silent: true,
			rawBuffer: this.raw,
			encoding: this.raw ? 'hex' : 'utf8'
		})
		
	}
	
	/**
	 * Connect to IPC Server
	 */
	connect():Promise<void> {
		if (this.connectDeferred)
			return this.connectDeferred.promise
		
		log.info(`Client ${processClientId} connecting to ${this.serverName}`)
		
		// Create the connect promise
		this.connectDeferred = Promise.defer()
		
		// Attach to the IPC server
		this.ipc.connectTo(this.serverName,() => {
			
			// Connect
			this.server.on(TransportEvents.Error,(err) => {
				log.error(`Error ${processClientId}`,err)
				// TODO: Implement backoff retry
				//this.connectDeferred.resolve(true)
				
			})
			
			// Connect
			this.server.on(TransportEvents.Connect,() => {
				log.info(`${processClientId} connected to ${this.serverName}`)
				this.disconnected = false
				this.connectDeferred.resolve(true)
				
				
			})
			
			// Disconnect
			this.server.on(TransportEvents.Disconnect,() => {
				log.info(`Disconnected ${processClientId} from ${this.serverName}`)
				
				// if (!this.connectDeferred.promise.isResolved())
				// 	this.connectDeferred.reject(new Error('Connection failed'))
				//this.disconnected = true
			})
			
			
			
			this.server.on('data',(buf) => {
				log.debug(`data received from ${this.serverName}`,buf)
				//IPCBufferedMessage.handleData(this,buf,this.onData)
				this.dataStream(null,buf)
				
			})
		})
		
		
		return this.connectDeferred
			.promise
			.timeout(START_TIMEOUT_DEFAULT)
			.catch(err => {
				log.error('Failed to connect',err)
				try {
					this.ipc.disconnect(this.serverName)
				} catch (err2) {}
				
				throw err
			})
		
	}
	
	
	
	emit(event:string, ...args):any {
		if (this.raw) {
			let
				content:any
			
			if (!isString(event)) {
				args = [event,...args]
				content = (args.length > 1) ? args : args[0]
			} else {
				content = {
					type: event,
					msg: (args.length > 1) ? args : args[0]
				}
			}
			const
				payload = msgpack.encode(content)
			this.server.emit(msgpack.encode(`@@dataStart-${payload.length}`))
			this.server.emit(payload)
		} else {
			this.server.emit(event,...args)
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
