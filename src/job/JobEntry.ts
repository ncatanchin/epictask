import storeBuilder from 'shared/store/AppStoreBuilder'
import JobService from './JobManager'


const log = getLogger(__filename)

let service: JobService = null

async function start() {
	
	log.info('Creating store')
	await storeBuilder()
	
	log.info('Creating job service')
	service = new (require('./JobManager').default as typeof JobService)()
	
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