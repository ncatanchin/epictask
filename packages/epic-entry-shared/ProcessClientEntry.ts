import "./ProcessClient"

import {ipcRenderer} from 'electron'

import {ProcessType} from './ProcessType'
//import {getServiceManager} from "epic-services"
import { START_TIMEOUT_DEFAULT } from "epic-global"
import { WindowEvents } from "epic-entry-shared/WindowTypes"

interface IMessageHandlers {
	[messageType:string]:ProcessClient.TProcessMessageHandler
}

const
	log = getLogger(__filename),
	
	// DEFAULT MESSAGE HANDLERS
	defaultMessageHandlers:IMessageHandlers = {
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
 * Base worker entry implementation which includes
 * all process management
 */
export abstract class ProcessClientEntry {
	
	private static _AutoLaunch = true
	
	
	/**
	 * Set auto launch enable/disable
	 *
	 * @param autoLaunch
	 */
	static setAutoLaunch(autoLaunch = true) {
		ProcessClientEntry._AutoLaunch = autoLaunch
	}
	
	/**
	 * Is AutoLaunch enabled or not
	 *
	 * @type {boolean}
	 */
	static get AutoLaunch() {
		return ProcessClientEntry._AutoLaunch
	}
	
	/**
	 * Reset promises, etc for entry
	 */
	static resetEntry() {
		startDeferred = null
		stopDeferred = null
	}
	
	/**
	 * Shut it down
	 *
	 * @param workerEntry
	 * @param workerStop
	 * @param exitCode
	 */
	static async stopEntry(workerEntry, workerStop, exitCode = 0) {
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
					log.warn('Worker cleanup failed', err)
				}
			}
		}
		
		stopDeferred.resolve()
		
		return stopDeferred.promise
		
	}
	
	/**
	 * Load services
	 *
	 * @returns {Promise<void>}
	 */
	static async loadServices(workerEntry:ProcessClientEntry) {
		if (workerEntry.servicesEnabled()) {
			log.info('Starting all services')
			await Promise
				.resolve(require('epic-services').getServiceManager().start())
				.timeout(START_TIMEOUT_DEFAULT)
		}
	}
	
	/**
	 * Initialize & start the worker process
	 *
	 * @param processType
	 * @param workerEntry
	 * @param workerInit
	 * @param workerStart
	 */
	static async startEntry(processType:ProcessType,
	                 workerEntry:ProcessClientEntry,
	                 workerInit:() => Promise<any>,
	                 workerStart:() => Promise<any>) {
		
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
					defaultMessageHandlers[ messageType ]))
		
		
		// Now bind to all the process events
		Env.isElectron && ipcRenderer.on('message', (event, { type, body }) =>
			ProcessClient.emit(type, body)
		)
		
		log.info(`Starting Worker Entry`)
		try {
			const
				windowId = getWindowId()
			
			log.debug(`Initializing ${windowId}`)
			await workerInit()
			
			// LOAD SERVICES
			log.debug(`Services Starting ${windowId}`)
			await ProcessClientEntry.loadServices(workerEntry)
			
			// START
			log.debug(`Workload Starting ${windowId}`)
			await workerStart()
			
			log.debug(`Process fully started: ${windowId}`)
			Env.isElectron && ipcRenderer.send(WindowEvents.AllResourcesLoaded, windowId)
			startDeferred.resolve(true)
		} catch (err) {
			log.error('Failed to start worker', err)
			startDeferred.reject(err)
			
		}
		
		return startDeferred.promise
	}
	/**
	 * Create a new WorkerEntry
	 *
	 * @param processType
	 */
	constructor(private processType:ProcessType) {
		log.debug(`Auto Launch is ${ProcessClientEntry.AutoLaunch}`)
		if (ProcessClientEntry.AutoLaunch) {
			this.launch()
		}
	}
	
	/**
	 * start the entry
	 */
	async launch() {
		await ProcessClientEntry.startEntry(this.processType, this, () => this.init(),() => this.start())
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
		ProcessClientEntry.stopEntry(this,() => this.stop(exitCode))
		
	}
	
	cleanup(exitCode = 0) {
		
	}
	
}


export namespace ProcessClientEntry {
	
	
}


export default ProcessClientEntry