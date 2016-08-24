import storeBuilder from 'shared/store/AppStoreBuilder'
import {JobManager as JobManagerType} from './JobManager'

const log = getLogger(__filename)

let service: JobManagerType = null

async function start() {
	
	log.info('Creating store')
	await storeBuilder()
	
	log.info('Creating job service')
	const JobManager = require('./JobManager').default as typeof JobManagerType
	service = new JobManager()
	
	log.info('Starting job service')
	service.start()
	log.info('Booted job service')
	
}



function destroyService() {
	try {
		if (service)
			service.kill()
		
		service = null
	} catch (err) {
		log.error('Failed to stop service', err)
	}
	
}

// If hot is enabled
if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		destroyService()
	})
	
	// Job service update - restart it
	module.hot.accept(['./JobManager'], () => {
		destroyService()
		start()
	})
	
	module.hot.accept()
}

start()