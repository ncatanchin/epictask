import {EventEmitter} from "events"
import { clearArray } from "epic-global/ObjectUtil"
import {Map} from 'immutable'
const
	log = getLogger(__filename)



/**
 * Available Transport Schemes
 */
export enum TransportScheme {
	IPC = 1
}

/**
 * Default Transport Events
 * @type {{}}
 */
export const TransportEvents = {
	Connect:  'connect',
	Disconnect: 'disconnect',
	Error: 'error'
}

/**
 * Transport options
 */
export interface ITransportOptions {
	scheme?:TransportScheme
	hostname?:string
	url?:string
}


/**
 * Transport constructor shape
 */
export interface ITransportConstructor {
	new (opts: ITransportOptions): Transport
}



/**
 * Transport
 *
 * @class Transport
 * @constructor
 **/
export abstract class Transport extends EventEmitter {
	
	/**
	 * Options string identifier for the client, could return null,
	 * but not a great idea
	 */
	abstract get clientId():string
	
	/**
	 * Get the support scheme
	 */
	abstract get scheme():TransportScheme
	
	/**
	 * Get the underlying emitter
	 */
	abstract get eventEmitter():EventEmitter
	
	/**
	 * Is connected
	 */
	abstract get connected():boolean
	
	/**
	 * Create Transport
	 */
	constructor(public opts:ITransportOptions = {}) {
		super()
	}
	
	/**
	 * Connect the transport
	 */
	abstract async connect():Promise<void>
	
	/**
	 * Disconnect the transport
	 */
	abstract disconnect():void
	
	
	/**
	 * Wait for connection
	 */
	abstract async waitForConnection()
	
	private listenerMap = Map<string,Function[]>().asMutable()
	
	
	
	// Event emitter map funcs
	addListener(event: string, listener: Function) {
		this.on(event,listener)
		
		
		return this
	}
	on(event: string, listener: Function) {
		const
			listeners = this.listeners(event)
		
		if (!listeners.includes(listener))
			listeners.push(listener)
		
		
		return this
	}
	once(event: string, listener: Function){
		this.eventEmitter.once(event,listener)
		return this
	}
	removeListener(event: string, listener: Function){
		const
			listeners = this.listeners(event),
			index = listeners.indexOf(listener)
		
		if (index > -1)
			listeners.splice(index,1)
		
		this.eventEmitter.removeListener && this.eventEmitter.removeListener(event,listener)
		return this
	}
	removeAllListeners(event?: string){
		const
			listeners = this.listeners(event)
		
		clearArray(listeners)
		
		this.eventEmitter.removeAllListeners(event)
		return this
	}
	setMaxListeners(n: number) {
		this.eventEmitter.setMaxListeners(n)
		return this
	}
	getMaxListeners() {
		return this.eventEmitter.getMaxListeners()
	}
	listeners(event: string) {
		let
			listeners = this.listenerMap.get(event)
		
		if (!listeners) {
			listeners = []
			this.listenerMap.set(event,listeners)
		}
		return listeners
	}
	emit(event: string, ...args: any[]) {
		return this.eventEmitter.emit(event,...args)
	}
	listenerCount(type: string) {
		return this.eventEmitter.listenerCount(type)
	}
	
	
}

export default Transport

// Hot-Module-Replacement in Dev Mode
if (module.hot) {
	module.hot.accept(() => {
		log.info(`Hot Reloading`, __filename)
	})
}

