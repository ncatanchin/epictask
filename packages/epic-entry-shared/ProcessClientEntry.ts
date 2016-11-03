import {ipcRenderer} from 'electron'
import {ProcessType} from './ProcessType'
import { ProcessClient } from "epic-global/ProcessClient"
import { START_TIMEOUT_DEFAULT } from "epic-net/NetworkConfig"
import {getServiceManager} from "epic-services"

const
	log = getLogger(__filename)


//region WorkerClient
const defaultMessageHandlers:{[messageType:string]:ProcessClient.TProcessMessageHandler} = {
	ping(workerEntry, messageType:string, data:any) {
		if (workerEntry.running) {
			ProcessClient.sendMessage('pong')
		} else {
			log.info(`Worker is not yet ready`)
		}
	}
}



//endregion

let
	startDeferred:Promise.Resolver<any> = null,
	stopDeferred:Promise.Resolver<any> = null

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
 * @param workerInit
 * @param workerStart
 */
async function startProcessClient(
	processType:ProcessType,
	workerEntry:ProcessClientEntry,
	workerInit:() => Promise<any>,
	workerStart:() => Promise<any>
) {
	
	// If already initialized then return
	if (startDeferred)
		return startDeferred.promise
	
	// Create the resolver
	startDeferred = Promise.defer()
	
	// Add the default handlers first
	Object
		.keys(defaultMessageHandlers)
		.forEach(messageType =>
			ProcessClient.makeMessageHandler(
				workerEntry,
				messageType,
				defaultMessageHandlers[messageType]))
	
	
	// Now bind to all the process events
	ipcRenderer.on('message',(event,{type,body}) => {
		const
			handler = ProcessClient.getMessageHandler(type)
		
		assert(handler,`No handler defined for ${type}`)
		
		handler(type,body)
	})
	
	log.info(`Starting Worker Entry`)
	try {
		await workerInit()
		
		if (workerEntry.servicesEnabled()) {
			log.info('Starting all services')
			await Promise
				.resolve(getServiceManager().start())
				.timeout(START_TIMEOUT_DEFAULT)
		}
		
		await workerStart()
		log.info(`Worker start successfully`)
		
		
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
export abstract class ProcessClientEntry {
	
	
	/**
	 * Create a new WorkerEntry
	 *
	 * @param processType
	 */
	constructor(private processType:ProcessType) {
		startProcessClient(processType,this, () => this.init(),() => this.start())
	}
	
	/**
	 * Whether services are enabled for this entry
	 *
	 * @returns {boolean}
	 */
	servicesEnabled() {
		return true
	}
	
	stateStoreEnabled() {
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
	
	
	protected async init() {
		
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

export default ProcessClientEntry