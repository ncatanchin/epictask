import "epic-entry-shared/AppEntry"
import { ProcessType } from "epic-entry-shared/ProcessType"
import {loadProcessClientEntry} from "epic-entry-shared"

const
	{ProcessClientEntry} = loadProcessClientEntry(),
	log = getLogger(__filename)


log.info(`Starting job server`)

/**
 * Creates and is responsible for the JobServer process
 *
 * Simply registers the job manager service on create
 */
class JobServerEntry extends ProcessClientEntry {
	
	/**
	 * Register the job manager service
	 */
	constructor() {
		super(ProcessType.JobServer)
	}
	
	/**
	 * Before ANYTHING ELSE - load the app store
	 */
	protected async init() {
		await require('epic-typedux/store/AppStoreBuilder').storeBuilder()
		
		require('./JobManagerService')
		require('./JobSchedulerService')
		require('./GithubEventMonitorService')
		require("./JobExecutors").loadAllExecutors()
		
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
const
	jobServerEntry = new JobServerEntry()


// If hot is enabled
if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		jobServerEntry.kill()
	})
	
	module.hot.accept(() => log.info(`Hot Reload`,__filename))
}


export {
	
}