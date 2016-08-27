import ProcessType from 'shared/ProcessType'
import WorkerEntry from "shared/WorkerEntry"
// import {getJobManager as getJobManagerType,JobManager as JobManagerType} from './JobManager'


const log = getLogger(__filename)


export class JobServerEntry extends WorkerEntry {
	
	constructor() {
		super(ProcessType.JobServer)
		require('./JobManagerService')
	}
	
	
	protected async start() {
		log.info('Starting JobServerEntry')
		// const getJobManager = require('./JobManagerService').default as typeof getJobManagerType
		// service = getJobManager()
		//
		// log.info('Starting job service')
		// service.start()
		// log.info('Booted job service')
		
	}
	
	protected async stop() {
		log.info(`Stopping JobServerEntry`)
		// try {
		//
		// } catch (err) {
		// 	log.error('Failed to stop service', err)
		// }
	}
}

/**
 * Singleton instance
 * 
 * @type {JobServerEntry}
 */
const jobServerEntry = new JobServerEntry()

export default jobServerEntry


// If hot is enabled
if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		jobServerEntry.kill()
	})
	
	module.hot.accept(() => log.info(`Hot Reload`,__filename))
}

