import {EventEmitter} from "events"

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
 * Map of Transport enum values to function providers
 */
export type TTransportProviderMap = {[name: string]: () => ITransportConstructor}


/**
 * Default scheme
 * @type {TransportScheme}
 */
const DefaultTransportScheme: TransportScheme =
	(TransportScheme[process.env.DefaultTransportScheme] || TransportScheme.IPC) as any


/**
 * Scheme >> Provider Mappings
 *
 * @type {TTransportProviderMap}
 */
const TransportSchemeProviders: TTransportProviderMap = {
	[TransportScheme[TransportScheme.IPC]]: () => require('./IPCTransport').default
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
	
	
	// Event emitter map funcs
	addListener(event: string, listener: Function) {
		this.eventEmitter.addListener(event,listener)
		return this
	}
	on(event: string, listener: Function) {
		this.eventEmitter.on(event,listener)
		return this
	}
	once(event: string, listener: Function){
		this.eventEmitter.once(event,listener)
		return this
	}
	removeListener(event: string, listener: Function){
		this.eventEmitter.removeListener && this.eventEmitter.removeListener(event,listener)
		return this
	}
	removeAllListeners(event?: string){
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
		return this.eventEmitter.listeners(event)
	}
	emit(event: string, ...args: any[]) {
		return this.eventEmitter.emit(event,...args)
	}
	listenerCount(type: string) {
		return this.eventEmitter.listenerCount(type)
	}
	
}

/**
 * Merge static functions
 */
export namespace Transport {
	
	/**
	 * Get a new transport for a given scheme and options
	 *
	 * @param opts
	 * @returns {Transport}
	 */
	export function getTransport(opts: ITransportOptions = {}) {
		
		const
			transportScheme = opts.scheme || getDefaultScheme(),
			transportProvider = TransportSchemeProviders[transportScheme] ||
				TransportSchemeProviders[TransportScheme[transportScheme]],
			transportClazz = transportProvider() as ITransportConstructor
		
		return new transportClazz(opts)
	}
	
	/**
	 * Get the default scheme currently configured
	 *
	 * @returns {TransportScheme}
	 */
	export function getDefaultScheme(): TransportScheme {
		return DefaultTransportScheme
	}
	
	
	/**
	 * Get a new default transport instance with options
	 *
	 * @param opts
	 * @returns {Transport}
	 */
	export function getDefault(opts: ITransportOptions = {}): Transport {
		return Transport.getTransport(assign(opts,{scheme:DefaultTransportScheme}))
	}
}

export default Transport

// Hot-Module-Replacement in Dev Mode
if (module.hot) {
	module.hot.accept(() => {
		log.info(`Hot Reloading`, __filename)
	})
}

