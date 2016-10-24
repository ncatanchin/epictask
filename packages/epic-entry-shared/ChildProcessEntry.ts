import {ipcRenderer} from 'electron'

import * as shortId from 'short-id'
import {getServiceManager} from "epic-services"
import {Bluebird} from 'epic-global'

import { START_TIMEOUT_DEFAULT } from "epic-net"
import { ProcessType } from "epic-global"
import { ChildClient } from "epic-common"

const
	log = getLogger(__filename)
	//ipc = require('node-ipc')



//region WorkerClient
const defaultMessageHandlers:{[messageType:string]:ChildClient.TWorkerMessageHandler} = {
	ping(workerEntry, messageType:string, data:any) {
		if (workerEntry.running) {
			ChildClient.sendMessage('pong')
		} else {
			log.info(`Worker is not yet ready`)
		}
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
	
	stopDeferred = Bluebird.defer()
	

	stopDeferred.promise
		.finally(() => window.close())// process.env.EPIC_CHILD && process.exit(exitCode))
	
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
async function startChildProcess(processType:ProcessType, workerEntry:ChildProcessEntry, workerStart:() => Promise<any>) {
	
	// If already initialized then return
	if (startDeferred)
		return startDeferred.promise
	
	// Create the resolver
	startDeferred = Bluebird.defer()
	
	// Add the default handlers first
	Object
		.keys(defaultMessageHandlers)
		.forEach(messageType =>
			ChildClient.makeMessageHandler(
				workerEntry,
				messageType,
				defaultMessageHandlers[messageType]))
	
	
	// Now bind to all the process events
	ipcRenderer.on('message',(event,{type,body}) => {
		const handler = ChildClient.getMessageHandler(type)
		assert(handler,`No handler defined for ${type}`)
		
		handler(type,body)
	})
	
	log.info(`Starting Worker Entry`)
	try {
		if (workerEntry.servicesEnabled()) {
			log.info('Starting all services')
			await Promise
				.resolve(getServiceManager().start())
				.timeout(START_TIMEOUT_DEFAULT)
		}
		
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
export abstract class ChildProcessEntry {
	
	
	/**
	 * Create a new WorkerEntry
	 *
	 * @param processType
	 */
	constructor(private processType:ProcessType) {
		startChildProcess(processType,this, () => this.start())
	}
	
	servicesEnabled() {
		return true
	}
	
	/**
	 * Is the worker in a running state
	 *
	 * @returns {boolean|Promise.Resolver<any>}
	 */
	get running() {
		return (!stopDeferred || !stopDeferred.promise.isResolved()) &&
			startDeferred &&
			startDeferred.promise.isResolved()
	}
	
	/**
	 * Wait for the server to be started and running
	 *
	 * @param timeout
	 */
	async waitForStart(timeout = START_TIMEOUT_DEFAULT) {
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

export default ChildProcessEntry