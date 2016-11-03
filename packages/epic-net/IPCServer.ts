
import { isString,toNumber } from  "typeguard"
import { makeIPCServerId } from "./IPCUtil"
import msgpack from 'msgpack-lite'
import IPCBufferedMessage from "epic-net/IPCBufferedMessage"
import { makeIPCMsgPackReadStream } from "epic-net/IPCBufferedMessage"
const
	log = getLogger(__filename),
	IPC = require('node-ipc').IPC
	//ipc = require('node-ipc')

//log.setOverrideLevel(LogLevel.DEBUG)
// ipc.config.id = ProcessConfig.getTypeName()
// ipc.config.retry = 1500
// ipc.config.silent = true


function getRawPayload(eventOrBuf,data) {
	return (isString(eventOrBuf) && data) ?
			msgpack.encode({type:eventOrBuf,msg:data}) :
		msgpack.encode(eventOrBuf)
	
}




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
	
	bufferedMessage:IPCBufferedMessage
	
	/**
	 * IPC Server Id
	 */
	readonly name:string
	
	constructor(name:string,private handlers:TIPCEventHandlers, private raw = false) {
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
	 * On raw data received
	 *
	 * @param socket
	 * @param data
	 */
	private onData = (socket,data) => {
		try {
			const
				{msg,type} = data,
				handler = this.handlers[ type ]
			
			try {
				if (!handler)
					return log.error(`Unknown msg type received ${type}`)
				
				handler(this, socket, type, msg)
			} catch (err) {
				log.error(`Failed to handle event: ${type}`,msg,err)
			}
		} catch (err) {
			log.error(`Failed to decode msg`,err)
		}
		
	}
	
	/**
	 * Raw database stream for decoding
	 *
	 * @type {(socket, buf:Buffer)=>any}
	 */
	private dataStream = makeIPCMsgPackReadStream(this.onData)
	
	/**
	 * Send raw data to socket
	 * @param socket
	 * @param buf
	 */
	send(socket,buf:any)
	
	/**
	 * Send data to a socket
	 *
	 * @param socket
	 * @param event
	 * @param data
	 */
	send(socket,event:string,data:any)
	send(socket,eventOrBuf:string|any,data:any = null) {
		try {
			if (!this.raw) {
				this.ipc.server.emit(socket, eventOrBuf, data)
			} else {
				const
					payload = getRawPayload(eventOrBuf,data)
				
				this.ipc.server.emit(socket,msgpack.encode(`@@dataStart-${payload.length}`))
				this.ipc.server.emit(socket, payload)
			}
		} catch (err) {
			log.error(`Failed to send`,eventOrBuf,data,socket,err)
		}
	}
	
	
	/**
	 * Broadcast a buffer
	 *
	 * @param buf
	 */
	broadcast(buf:any)
	/**
	 * Broadcast event
	 *
	 * @param event
	 * @param data
	 */
	broadcast(event:string,data:any)
	broadcast(eventOrBuf:string|any,data:any = null) {
		if (!this.raw) {
			this.ipc.server.broadcast(eventOrBuf, data)
		} else {
			const
				payload = getRawPayload(eventOrBuf,data)
			
			this.ipc.server.broadcast(msgpack.encode(`@@dataStart-${payload.length}`))
			this.ipc.server.broadcast(payload)
		}
	}
	
	/**
	 * Start the server
	 *
	 * @returns {Promise<any>}
	 */
	start():Promise<any> {
		if (this.startDeferred)
			return this.startDeferred.promise
		
		log.info(`Starting IPC Server: "${this.name}"`)
		
		this.startDeferred = Promise.defer()
			
		const ipc = this.ipc = new IPC
		
		assign(this.ipc.config,{
			id: this.name,
			retry: 1500,
			silent: true,
			rawBuffer: this.raw,
			encoding: this.raw ? 'hex' : 'utf8'
		})
		
		// Configure IPC Server
		ipc.serve(() => {
			ipc.server.on('connect',socket => {
				log.debug(`Client connected to: ${this.name}`)
				this.send(socket,{type: '@@connected'})
			})
			
			ipc.server.on('error',(err,socket) => {
				log.warn(`Error: ${this.name}`,err)
			})
			
			ipc.server.on('data',(buf:any,socket) => {
				log.debug('data received')
				//IPCBufferedMessage.handleData(this,buf,socket,this.onData)
				this.dataStream(socket,buf)
				//IPCBufferedMessage.handleData(this,socket,buf,this.onData)
				
				
			})
			
			Object.keys(this.handlers).forEach(event => {
				
				log.debug(`Registering handler ${event}`)
				const
					handler = this.handlers[event]
				
				ipc.server.on(event,(request, socket) => {
					log.debug(`Received event`,event,request,socket)
					handler(this,socket,event,request)
				})
			})
			
			// Notify StateServer
			log.debug('IPC Server is ready - notifying worker owner')
			
				
			Promise
				.delay(100)
				.then(() => this.startDeferred.resolve())
		})
		
		//Start IPC Server
		//Promise.setImmediate().then(() => ipc.server.start())
		ipc.server.start()
		
		return this.startDeferred.promise
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


