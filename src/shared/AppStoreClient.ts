import {ChildClient} from 'shared/ChildProcessEntry'
import * as uuid from 'node-uuid'
import { REQUEST_TIMEOUT, AppStoreServerName } from "shared/Constants"
import { getHot, setDataOnHotDispose } from "shared/util/HotUtils"
import {BrowserWindow,ipcMain} from 'electron'
import TWorkerProcessMessageHandler = ChildClient.TWorkerProcessMessageHandler
import { Transport } from "shared/net/Transport"

const
	log = getLogger(__filename),
	actionProxies = getHot(module,'actionProxies',{}),
	observers:{[id:string]:ObserveWrapper} = getHot(module,'observers',{}),
	stateRequests = getHot(module,'stateRequests',{})

let
	transport = getHot(module,'transport',null) as Transport

setDataOnHotDispose(module,() => ({
	actionProxies,
	observers,
	stateRequests,
	transport
}))

/**
 * Connect function - runs serially
 */
function connect():Promise<any> {
	if (!transport) {
		transport = Transport.getDefault({ hostname: AppStoreServerName })
		log.info(`Connecting to store server`)
		return transport
			.connect()
			.then(() => {
				log.info(`Store server CONNECTED`)
				attachEvents(transport)
			})
			
			.catch(err => {
				log.error(`Failed to connect to store server`,err)
				transport = null
			})
	}
	
	
	
	
	return transport
		.waitForConnection()
		
}

/**
 * Homogenized sendMessage to work in all processes
 */
const sendMessage = (type:string, body:any = {}) => {
	return connect().then(() => {
		transport.emit(type,body)
	})
}

function newActionClient(leaf,type) {
	return function(...args) {
		return sendMessage('actionRequest',{
			leaf,
			type,
			args
		})
	}
}

export function getActionClient(leaf:string):any {
	return new Proxy({},{
		get(target,type) {
			const fullName = `${leaf}.${type}`
			
			return actionProxies[fullName] ||
				(actionProxies[fullName] = newActionClient(leaf,type))
		}
	})
}


export type TClientStateHandler = (newValue,oldValue) => any

interface ObserveWrapper {
	id:string,
	keyPath:string|string[]
	resolver:Promise.Resolver<Function>
	handler:TClientStateHandler
	remover?:Function
}


function attachEvents(transport) {
	/**
	 * Handle observe state change
	 */
	transport.on('observeStateChange', ({ id, newValue, oldValue }) => {
		const observer = observers[ id ]
		if (!observer) {
			log.error(`Received a message for id ${id} - but no observer found`)
		}
		
		observer.handler(newValue, oldValue)
	})
	
	/**
	 * Handle observe responses
	 */
	transport.on('observeStateResponse', ({ id, err }) => {
		const
			observer = observers[ id ]
		
		if (!observer) {
			return log.error(`Got response for unknown observer ${id}`, id, err)
		}
		
		if (err) {
			return observer.resolver.reject(err)
		}
		
		observer.remover = () => {
			sendMessage("observeStateRemove", { id })
			delete observers[ id ]
		}
		
		observer.resolver.resolve(observer.remover)
		
	})
	
	
	transport.on('stateResponse', ({ id, value, err }) => {
		const
			request = stateRequests[ id ]
		
		if (!request) {
			return log.error(`Got response for unknown state request ${id}`, id,  value, err)
		}
		
		if (err) {
			return request.resolver.reject(err)
		}
		
		request.resolver.resolve(value)
	})
	
}



export function clientObserveState(keyPath:string|string[], handler:TClientStateHandler):Promise<Function> {
	
	const
		id = uuid.v4(),
		wrapper:ObserveWrapper = observers[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer(),
			handler
		},
		{ reject } = wrapper.resolver
	
	sendMessage('observeStateRequest', { id, keyPath }).catch(err => reject(err))
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to set state observer`, wrapper, err)
			delete observers[ id ]
			reject(err)
		})
	
}


export async function getStateValue(...keyPath:string[]):Promise<any> {
	const
		id = uuid.v4(),
		request = stateRequests[ id ] = {
			id,
			keyPath,
			resolver: Promise.defer()
		},
		{ reject } = request.resolver
	
	try {
		await sendMessage('stateRequest', { id, keyPath })
	} catch (err) {
		reject(err)
	}
	
	return request
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to get state value`, err)
			reject(err)
		})
}
// IMPLEMENT STATE/STORE WATCH