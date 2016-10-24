import {ChildProcessEntry as WorkerEntry} from "epic-entry-shared/ChildProcessEntry"

const
	log = getLogger(__filename)

require('./JobManagerService')
require('./JobSchedulerService')
require('./GithubEventMonitorService')


/**
 * Creates and is responsible for the JobServer process
 *
 * Simply registers the job manager service on create
 */
export class JobServerEntry extends WorkerEntry {
	
	/**
	 * Register the job manager service
	 */
	constructor() {
		super(ProcessType.JobServer)
	}
	
	
	/**
	 * Start the server
	 */
	protected async start() {
		log.info('Starting JobServerEntry')
	}
	
	/**
	 * Stop the server
	 */
	protected async stop() {
		log.info(`Stopping JobServerEntry`)
	}
}

/**
 * Singleton instance
 * 
 * @type {JobServerEntry}
 */
const jobServerEntry = new JobServerEntry()

/**
 * Singleton instance
 */
export default jobServerEntry


// If hot is enabled
if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		jobServerEntry.kill()
	})
	
	module.hot.accept(() => log.info(`Hot Reload`,__filename))
}

