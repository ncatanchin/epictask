import {ipcRenderer} from 'electron'
import { shortId } from "epic-util/IdUtil"
import {EventEmitter} from 'events'



const
	log = getLogger(__filename)

const
	workerId = process.env.WORKER_ID || `${__filename}-${shortId()}`,
	messageHandlers = new EventEmitter()

/**
 * WorkerClient global access
 */
export namespace ProcessClientGlobal {
	
	/**
	 * Worker Message handler shape
	 */
	export type TProcessMessageHandler = (workerEntry, messageType:string, data?:any) => void
	
	/**
	 * Raw process message handler
	 */
	export type TMessageHandler = (messageType:string, data?:any) => void
	
	/**
	 * Get all the current message handlers
	 *
	 * @returns {{}}
	 */
	export function getMessageHandlers() {
		return messageHandlers
	}
	
	/**
	 * Get a specific message handler
	 *
	 * @param type
	 * @param args
	 */
	export function emit(type:string,...args:any[]) {
		messageHandlers.emit(type,...args)
	}
	
	export function makeMessageHandler(workerEntry, messageType:string, messageHandler:TProcessMessageHandler) {
		const
			fn = (type:string,data:any) => {
				messageHandler(workerEntry,type,data)
			}
			
		return addMessageHandler(messageType,fn)
	}
	
	/**
	 * Add a worker message handler
	 *
	 * @param type
	 * @param fn
	 */
	export function addMessageHandler(type:string,fn:TMessageHandler) {
		log.info(`Registering worker message handler ${type}`)
		messageHandlers.on(type, fn)
		
		return () => removeMessageHandler(type,fn)
	}
	
	/**
	 * Remove worker message handler
	 *
	 * @param type
	 * @param fn
	 */
	export function removeMessageHandler(type:string,fn?:TMessageHandler) {
		log.info(`Removing worker message handler ${type}`)
		if (fn)
			messageHandlers.removeListener(type,fn)
		else
			messageHandlers.removeAllListeners(type)
	}
	
	/**
	 * Send a message to the worker parent
	 *
	 * @param type
	 * @param body
	 */
	export function sendMessage(type:string, body:any = {}) {
		log.debug(`Sending message of type ${type}`)
		//ipcRenderer.sendToHost(type,{workerId,type,body})
		ipcRenderer.send('child-message',{processTypeName:ProcessConfig.getTypeName(),workerId,type,body})
		//process.send({workerId,type, body})
	}
	
}

/**
 * Declare client type
 */
export type TProcessClient = typeof ProcessClientGlobal

// /**
//  * Expose declaration
//  */
// declare global {
//
// }

// ASSIGN GLOBALLY
assignGlobal({
	ProcessClient:ProcessClientGlobal
})
