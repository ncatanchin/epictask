import * as shortId from 'short-id'

import 'shared/NodeEntryInit'
//import {WorkerEventType} from "shared/WorkerEventType"

const
	log = getLogger(__filename),
	workerId = process.env.WORKER_ID || `${__filename}-${shortId.generate()}`,
	messageHandlers = {}


/**
 * Worker Message handler shape
 */
export type TWorkerMessageHandler = (type:string,data?:any) => void

/**
 * Add a worker message handler
 *
 * @param type
 * @param fn
 */
function addMessageListener(type:string,fn:TWorkerMessageHandler) {
	log.info(`Registering worker message handler ${type}`)
	messageHandlers[type] = fn
}

/**
 * Remove worker message handler
 *
 * @param type
 */
function removeMessageListener(type:string) {
	log.info(`Removing worker message handler ${type}`)
	delete messageHandlers[type]
}

/**
 * Send a message to the worker parent
 *
 * @param type
 * @param body
 */
function sendMessage(type:string, body:any = {}) {
	log.debug(`Sending message of type ${type}`)
	process.send({workerId,type, body})
}


/**
 * Send worker ready event
 */
function ready() {
	
	// Register PING listener
	addMessageListener('ping',(type:string) => {
		sendMessage('pong')
	})

	// Finally register the message handler
	process.on('message', ({type,body}) => {
		const handler = messageHandlers[type]
		assert(handler,`No handler defined for ${type}`)
		
		handler(type,body)
	})
	
}

// /**
//  * Add a worker message listener
//  *
//  * @param eventType
//  * @param listener
//  */
// function workerAddMessageListenerGlobal(eventType:WorkerEventType,listener:(eventType:WorkerEventType,...args:any[]) => void) {
//
// }

const WorkerClientGlobal = {
	ready,
	sendMessage,
	addMessageListener,
	removeMessageListener
}

/**
 * Augment global scope with worker functions
 */
declare global {
	
	//noinspection JSUnusedLocalSymbols
	var WorkerClient:typeof WorkerClientGlobal
	
}

// Now assign the globals
assignGlobal({
	WorkerClient:WorkerClientGlobal
})


