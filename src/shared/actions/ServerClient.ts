import * as uuid from 'node-uuid'
import {EventEmitter} from "events"

import {getModel} from 'shared/Registry'

// Configure IPC client first
const
	log = getLogger(__filename),
	ipc = require('node-ipc'),
	clientId = `clientState-${process.pid}`


ipc.config.id = clientId
ipc.config.retry = 1500


/**
 * State Server Response
 */
export interface IStateServerResponse {
	id:string
	clientId?:string
	type:string
	error?:Error
	result?:any
	
}

/**
 * State Server Request
 */
export interface IStateServerRequest {
	id:string
	clientId?:string
	type:string
	resolver:Promise.Resolver<IStateServerResponse>
	data?:any
}

const
	connDeferred = Promise.defer(),
	pendingRequests = {} as {[id:string]:IStateServerRequest},
	clientActionEmitter = new EventEmitter()




/**
 * Get StateServer reference
 *
 * @returns {any}
 */
function getStateServer() {
	return ipc.of.StateServer
}

/**
 * Attach to state server events
 */
function listen() {
	const StateServer = getStateServer()
	
	// Listen for connection event
	StateServer.on('connect', () => {
		log.info(`Connected ${clientId}`)
		
		connDeferred.resolve(true)
	})
	
	// Listen for disconnect events
	StateServer.on('disconnect',() => {
		log.info(`Disconnected ${clientId}`)
	})
	
	// Response from request
	StateServer.on('response',(result) => {
		const request = pendingRequests[result.id]
		if (!request)
			throw new Error(`Unknown request id ${result.id}`)
		
		// Delete the pending request
		delete pendingRequests[result.id]
		
		const {error,data} = result
		if (error)
			request.resolver.reject(error instanceof Error ? error : new Error(error))
		else
			request.resolver.resolve(data)
	})
	
	// Action received
	StateServer.on('action',action => {
		if (action.source && action.source.clientId === clientId) {
			log.debug('I sent this message, ignoring', clientId)
			return
		}
		
		clientActionEmitter.emit('action',action)
	})
}

/**
 * Connect to state server
 */
function connect() {
	ipc.connectTo('StateServer',listen)
}

// Connect on load
connect()

async function request(type:string,data:any = null) {
	
	// Ensure connection is established
	await waitForConnection()

	// Create the request
	const request:IStateServerRequest = {
		id: uuid.v4(),
		clientId,
		resolver: Promise.defer(),
		type,
		data
	}
	
	// Add the request to the pending map
	pendingRequests[request.id] = request
	
	// Send the request
	getStateServer().emit('request',{
		id: request.id,
		clientId,
		type,
		data
	})
	
	// Wait for the result
	return await request.resolver.promise
}

/**
 * Wait for the connection promise to resolve
 */
async function waitForConnection() {
	const connPromise = connDeferred.promise
	
	if (!connPromise.isResolved()) {
		log.info('Not connected yet, waiting...')
		await connPromise
	}
}

/**
 * get state from state server
 *
 * @returns {any}
 */
export async function getState() {
	log.info(`Getting Server State for client ${clientId}`)



	// Hydrate the state returned from the main process
	const hydrateState = (state) => {
		//return RootState.fromJS(state)
		const mappedState = Object
			.keys(state)
			.reduce((tempState,nextKey) => {
				const modelClazz = getModel(nextKey)
				const value = state[nextKey]
				tempState[nextKey] = modelClazz ?
					modelClazz.fromJS(value) :
					value
				return tempState
			},{})
		
		return Immutable.Map(mappedState)
		
		
		
	}
	
	// Send request and wait for result
	const rawState = await request('getState')
	
	return hydrateState(rawState)
}

/**
 *
 * @param leaf
 * @param name - typedux calls it type
 * @param args
 */
export function sendAction(leaf:string,name:string,...args:any[]) {
	getStateServer().emit('action',{
		clientId,
		leaf,
		name,
		args
	})
}

/**
 * Action listener signature
 */
export type TServerClientActionListener = (action) => void

/**
 * Add an action listener
 *
 * @param listener
 */
export function addActionListener(listener:TServerClientActionListener):void {
	clientActionEmitter.addListener('action',listener)
}


/**
 * Remove action listener
 */
export function removeActionListener(listener:TServerClientActionListener):void {
	clientActionEmitter.removeListener('action',listener)
}
