import WorkerEntry from "shared/WorkerEntry"
import storeBuilder from 'shared/store/AppStoreBuilder'
import {JobManager as JobManagerType} from './JobManager'


const log = getLogger(__filename)

let service: JobManagerType = null

export class JobServerEntry extends WorkerEntry {
	
	constructor() {
		super(ProcessType.JobServer)
	}
	
	
	protected async start() {
		
		log.info('Creating store')
		await storeBuilder()
		
		log.info('Creating job service')
		const JobManager = require('./JobManager').default as typeof JobManagerType
		service = new JobManager()
		
		log.info('Starting job service')
		service.start()
		log.info('Booted job service')
		
	}
	
	protected async stop() {
		try {
			if (service)
				service.kill()
			
			service = null
		} catch (err) {
			log.error('Failed to stop service', err)
		}
	}
}

const jobServerEntry = new JobServerEntry()

export default jobServerEntry


// If hot is enabled
if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		jobServerEntry.kill()
	})
	
	module.hot.accept()
}

