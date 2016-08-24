import 'shared/NodeEntryInit'
import * as shortId from 'short-id'
import {ProcessType} from "shared/ProcessType"

const
	log = getLogger(__filename),
	ipc = require('node-ipc')
	

//region WorkerClient
const defaultMessageHandlers:{[messageType:string]:WorkerClient.TWorkerMessageHandler} = {
	ping(workerEntry:WorkerEntry,messageType:string,data:any) {
		if (workerEntry.running) {
			WorkerClient.sendMessage('pong')
		}
		
		log.info(`Worker is not yet ready`)
	}
}

const
	workerId = process.env.WORKER_ID || `${__filename}-${shortId.generate()}`,
	messageHandlers = {}

	
let noKill = false
	
/**
 * WorkerClient global access
 */
export namespace WorkerClient {
	
	export function setNoKill(newNoKill) {
		noKill = newNoKill
	}
	
	/**
	 * Worker Message handler shape
	 */
	export type TWorkerMessageHandler = (workerEntry:WorkerEntry,messageType:string,data?:any) => void
	
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
	
	export function makeMessageHandler(workerEntry:WorkerEntry,messageType:string,messageHandler:TWorkerMessageHandler) {
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
		process.send({workerId,type, body})
	}
	
	
}
//endregion

let startDeferred:Promise.Resolver<any> = null
let stopDeferred:Promise.Resolver<any> = null

/**
 * Shut it down
 *
 * @param workerEntry
 * @param workerStop
 * @param exitCode
 */
async function stopWorker(workerEntry,workerStop,exitCode = 0) {
	if (stopDeferred) {
		return stopDeferred.promise
	}
	
	stopDeferred = Promise.defer()
	

	stopDeferred.promise
		.finally(() => {
			!noKill && process.exit(exitCode)
		})
	
	if (workerEntry.running) {
		log.info(`Stopping worker with exit code: ${exitCode}`)
		
		try {
			await workerStop(exitCode)
		} catch (err) {
			log.error('failed to shutdown worker', err)
		} finally {
			try {
				workerEntry.cleanup()
			} catch (err) {
				log.warn('Worker cleanup failed',err)
			}
		}
	}
	
	stopDeferred.resolve()
	
	return stopDeferred.promise
		
}

/**
 * Initialize & start the worker process
 *
 * @param processType
 * @param workerEntry
 * @param workerStart
 */
async function startWorker(processType:ProcessType,workerEntry:WorkerEntry,workerStart:() => Promise<any>) {
	
	// If already initialized then return
	if (startDeferred)
		return startDeferred.promise
	
	// Create the resolver
	startDeferred = Promise.defer()
	
	// Add the default handlers first
	Object
		.keys(defaultMessageHandlers)
		.forEach(messageType =>
			WorkerClient.makeMessageHandler(
				workerEntry,
				messageType,
				defaultMessageHandlers[messageType]))
	
	// process.on('disconnect',(exitCode) => stopWorker(workerEntry,exitCode))
	// process.on('beforeExit',(exitCode) => stopWorker(workerEntry,exitCode))
	//
	// process.on('exit',(exitCode) => {
	// 	workerEntry.kill(exitCode)
	// })
	
	// Now bind to all the process events
	process.on('message', ({type,body}) => {
		const handler = WorkerClient.getMessageHandler(type)
		assert(handler,`No handler defined for ${type}`)
		
		handler(type,body)
	})
	
	log.info(`Starting Worker Entry`)
	try {
		await workerStart()
		startDeferred.resolve(true)
	} catch (err) {
		log.error('Failed to start worker',err)
		startDeferred.reject(err)
		
	}
	
	return startDeferred.promise
}


/**
 * Base worker entry implementation which includes
 * all process management
 */
export abstract class WorkerEntry {
	
	
	/**
	 * Create a new WorkerEntry
	 *
	 * @param processType
	 */
	constructor(private processType:ProcessType) {
		startWorker(processType,this, () => this.start())
	}
	
	/**
	 * Is the worker in a running state
	 *
	 * @returns {boolean|Promise.Resolver<any>}
	 */
	get running() {
		return (!stopDeferred || !stopDeferred.promise.isResolved()) && startDeferred && startDeferred.promise.isResolved()
	}
	
	/**
	 * Wait for the server to be started and running
	 *
	 * @param timeout
	 */
	async waitForStart(timeout = 5000) {
		await startDeferred
			.promise
			.timeout(timeout)
	}
	
	/**
	 * Called to start the worker
	 */
	protected abstract async start();
	
	/**
	 * Called to stop the worker
	 */
	protected abstract async stop(exitCode);
	
	
	/**
	 * Call on process exit, just in case it is still running
	 *
	 * @param exitCode
	 */
	async kill(exitCode = 0) {
		stopWorker(this,() => this.stop(exitCode))
		
	}
	
	cleanup(exitCode = 0) {
		
	}
	
}

export default WorkerEntry