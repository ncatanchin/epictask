import {ChildClient} from 'shared/ChildProcessEntry'
import * as uuid from 'node-uuid'
import { REQUEST_TIMEOUT } from "shared/Constants"
import { getHot, setDataOnDispose } from "shared/util/HotUtils"
import {BrowserWindow,ipcMain} from 'electron'
import TWorkerProcessMessageHandler = ChildClient.TWorkerProcessMessageHandler

const
	log = getLogger(__filename),
	actionProxies = getHot(module,'actionProxies',{}),
	observers:{[id:string]:ObserveWrapper} = getHot(module,'observers',{}),
	stateRequests = getHot(module,'stateRequests',{})

setDataOnDispose(module,() => ({
	actionProxies,
	observers,
	stateRequests
}))

/**
 * Homogenized sendMessage to work in all processes
 */
const sendMessage = (type:string, body:any = {}) => {
	if (ipcMain) {
		const browserWindow = require('main/MainWindow').getBrowserWindow() as Electron.BrowserWindow
		browserWindow.webContents.send(type, body)
	} else {
		ChildClient.sendMessage(type,body)
	}
}


const addMessageHandler = (type:string,handler:TWorkerProcessMessageHandler) => {
	if (ipcMain)
		ipcMain.on(type,(event,body) => {
			handler(type,body)
		})
	else
		ChildClient.addMessageHandler(type,handler)
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



/**
 * Handle observe state change
 */
ChildClient.addMessageHandler('observeStateChange',(type,{id,newValue,oldValue}) => {
	const observer = observers[id]
	if (!observer) {
		log.error(`Received a message for id ${id} - but no observer found`)
	}
	
	observer.handler(newValue,oldValue)
})

/**
 * Handle observe responses
 */
addMessageHandler('observeStateResponse',(type,{id,err}) => {
	const
		observer = observers[id]
	
	if (!observer) {
		return log.error(`Got response for unknown observer ${id}`,id,type,err)
	}
	
	if (err) {
		return observer.resolver.reject(err)
	}
	
	observer.remover = () => {
		sendMessage("observeStateRemove",{id})
		delete observers[id]
	}
	
	observer.resolver.resolve(observer.remover)
	
})

export function clientObserveState(keyPath:string|string[],handler:TClientStateHandler):Promise<Function> {
	
	const
		id = uuid.v4(),
		wrapper:ObserveWrapper = observers[id] = {
			id,
			keyPath,
			resolver: Promise.defer(),
			handler
		},
		{reject} = wrapper.resolver
	
	try {
		sendMessage('observeStateRequest', {id,keyPath})
	} catch (err) {
		reject(err)
	}
	
	return wrapper
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to set state observer`,wrapper,err)
			delete observers[id]
			reject(err)
		})
	
}


addMessageHandler('stateResponse',(type,{id,value,err}) => {
	const
		request = stateRequests[id]
	
	if (!request) {
		return log.error(`Got response for unknown state request ${id}`,id,type,value,err)
	}
	
	if (err) {
		return request.resolver.reject(err)
	}
	
	request.resolver.resolve(value)
})


export async function getStateClient(...keyPath:string[]):Promise<any> {
	const
		id = uuid.v4(),
		request = stateRequests[id] = {
			id,
			keyPath,
			resolver:Promise.defer()
		},
		{reject} = request.resolver
	
	try {
		sendMessage('stateRequest', {id,keyPath})
	} catch (err) {
		reject(err)
	}
	
	return request
		.resolver
		.promise
		.timeout(REQUEST_TIMEOUT)
		.catch((err) => {
			log.error(`Failed to get state value`,err)
			reject(err)
		})
}

// IMPLEMENT STATE/STORE WATCH