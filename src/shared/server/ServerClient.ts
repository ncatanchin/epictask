import * as uuid from 'node-uuid'
import {EventEmitter} from "events"

import {getModel} from 'shared/Registry'
import {Transport} from "shared/net/Transport"
import {ProcessNames} from "shared/ProcessType"
import {VariableProxy} from "shared/util/VariableProxy"

// Configure IPC client first
const log = getLogger(__filename)


/**
 * State Server Response
 */
export interface IStateServerResponse {
	id: string
	clientId?: string
	type: string
	error?: Error
	result?: any
	
}

/**
 * State Server Request
 */
export interface IStateServerRequest {
	id: string
	clientId?: string
	type: string
	resolver: Promise.Resolver<IStateServerResponse>
	data?: any
}


/**
 * Action listener signature
 */
export type TServerClientActionListener = (action) => void


// Create the singleton
let serverClient:ServerClient = null

let serverClientProxy:VariableProxy<ServerClient> = _.get(module,'hot.data.proxy',null)

export class ServerClient {
	pendingRequests = {} as {[id: string]: IStateServerRequest}
	
	clientActionEmitter = new EventEmitter()
	
	
	static getInstance():ServerClient {
		if (!serverClient)
			serverClient = new ServerClient()
		
		if (!serverClientProxy)
			serverClientProxy = new VariableProxy(ServerClient as any,serverClient)
		else
			serverClientProxy.setTargets(ServerClient,serverClient)
		
		return serverClientProxy.handler
	}
	
	/**
	 * Get the clients id (usually PID)
	 *
	 * @returns {string}
	 */
	get clientId() {
		return this.transport.clientId
	}
	
	/**
	 * All the transport event handlers
	 *
	 */
	private transportHandlers = {
		
		// Handle 'response'
		response: (result) => {
			const request = this.pendingRequests[result.id]
			
			if (!request)
				throw new Error(`Unknown request id ${result.id}`)
			
			// Delete the pending request
			delete this.pendingRequests[result.id]
			
			const {error, data} = result
			if (error)
				request.resolver.reject(error instanceof Error ? error : new Error(error))
			else
				request.resolver.resolve(data)
		},
		
		// Handle 'action'
		action: (action) => {
			if (action.source && action.source.clientId === this.transport.clientId) {
				log.debug('I sent this message, ignoring', this.transport.clientId)
				return
			}
			
			this.clientActionEmitter.emit('action', action)
		}
	}
	
	/**
	 * Underlying transport - probably IPC
	 */
	public transport: Transport
	
	/**
	 * Create a new Server Client
	 */
	private constructor() {
		this.transport = Transport.getDefault({hostname: ProcessNames.Server})
		this.connect()
	}
	
	
	/**
	 * Disconnect and remove all listeners immediately
	 *
	 * @returns {Promise<void>|Promise<boolean>}
	 */
	kill() {
		this.transport.disconnect()
		return Promise.resolve(true)
	}
	
	
	/**
	 * Connect to the server
	 */
	async connect() {
		if (ProcessConfig.isType(ProcessConfig.Type.Server)) {
			log.info(`This is the state server and it does not connect the transport - obviously`)
		} else {
			await this.transport.connect()
			Object
				.keys(this.transportHandlers)
				.forEach(event => this.transport.on(event, this.transportHandlers[event]))
		}
	}
	
	/**
	 * Send request to state server
	 *
	 * @param type
	 * @param data
	 * @returns {IStateServerResponse}
	 */
	async request(type: string, data: any = null) {
		
		// Ensure connection is established
		await this.transport.waitForConnection()
		
		// Create the request
		const request: IStateServerRequest = {
			id: uuid.v4(),
			clientId: this.transport.clientId,
			resolver: Promise.defer(),
			type,
			data
		}
		
		// Add the request to the pending map
		this.pendingRequests[request.id] = request
		
		// Send the request
		this.transport.emit('request', {
			id: request.id,
			clientId: this.transport.clientId,
			type,
			data
		})
		
		// Wait for the result
		return await request.resolver.promise
	}
	
	
	/**
	 * get state from state server
	 *
	 * @returns {any}
	 */
	async getState() {
		log.info(`Getting Server State for client ${this.clientId}`)
		
		
		// Hydrate the state returned from the main process
		const hydrateState = (state) => {
			//return RootState.fromJS(state)
			const mappedState = Object
				.keys(state)
				.reduce((tempState, nextKey) => {
					const modelClazz = getModel(nextKey)
					const value = state[nextKey]
					tempState[nextKey] = modelClazz ?
						modelClazz.fromJS(value) :
						value
					return tempState
				}, {})
			
			return Immutable.Map(mappedState)
			
			
		}
		
		// Send request and wait for result
		const rawState = await this.request('getState')
		
		return hydrateState(rawState)
	}
	
	/**
	 *
	 * @param leaf
	 * @param name - typedux calls it type
	 * @param args
	 */
	sendAction(leaf: string, name: string, ...args: any[]) {
		this.transport.emit('action', {
			clientId: this.clientId,
			leaf,
			name,
			args
		})
	}
	
	
	/**
	 * Add an action listener
	 *
	 * @param listener
	 */
	addActionListener(listener: TServerClientActionListener): void {
		this.clientActionEmitter.addListener('action', listener)
	}
	
	
	/**
	 * Remove action listener
	 */
	removeActionListener(listener: TServerClientActionListener): void {
		this.clientActionEmitter.removeListener('action', listener)
	}
	
	
}

export function getServerClient() {
	return ServerClient.getInstance()
}

// Register the singleton client
Container.bind(ServerClient).provider({get: getServerClient})

// Export the singleton client
export default getServerClient()


module.hot.dispose((data:any) => {
	assign(data,{proxy:serverClientProxy})
	try {
		serverClient.kill()
	} catch (err) {}
})

