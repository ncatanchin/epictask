import {ipcRenderer} from 'electron'

import * as shortId from 'short-id'


const
	log = getLogger(__filename)

const
	workerId = process.env.WORKER_ID || `${__filename}-${shortId.generate()}`,
	messageHandlers = {}

/**
 * WorkerClient global access
 */
export namespace ChildClient {
	
	/**
	 * Worker Message handler shape
	 */
	export type TWorkerMessageHandler = (workerEntry, messageType:string, data?:any) => void
	
	/**
	 * Raw process message handler
	 */
	export type TWorkerProcessMessageHandler = (messageType:string,data?:any) => void
	
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
	 * @returns {any}
	 */
	export function getMessageHandler(type:string) {
		return getMessageHandlers()[type]
	}
	
	export function makeMessageHandler(workerEntry, messageType:string, messageHandler:TWorkerMessageHandler) {
		addMessageHandler(messageType,(messageType:string,data:any) => {
			messageHandler(workerEntry,messageType,data)
		})
		
	}
	
	/**
	 * Add a worker message handler
	 *
	 * @param type
	 * @param fn
	 */
	export function addMessageHandler(type:string,fn:TWorkerProcessMessageHandler) {
		log.info(`Registering worker message handler ${type}`)
		messageHandlers[type] = fn
	}
	
	/**
	 * Remove worker message handler
	 *
	 * @param type
	 */
	export function removeMessageHandler(type:string) {
		log.info(`Removing worker message handler ${type}`)
		delete messageHandlers[type]
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