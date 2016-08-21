import Electron from 'electron'
import JobService from './JobService'
import storeBuilder from 'shared/store/AppStoreBuilder'

const
	{app} = Electron,
	log = getLogger(__filename)

let service: JobService = null

async function start() {
	
	log.info('Creating store')
	await storeBuilder()
	
	log.info('Creating job service')
	service = new (require('./JobService').default as typeof JobService)()
	
	log.info('Starting job service')
	service.start()
	log.info('Booted job service')
	
}

//On App Ready - Start!!
app.on('ready', start)


function destroyService() {
	try {
		if (service)
			service.kill()
		
		service = null
	} catch (err) {
		log.error('Failed to stop service', err)
	}
	
}

if (module.hot) {
	
	// On dispose, clean up
	module.hot.dispose(() => {
		destroyService()
	})
	
	// Job service update - restart it
	module.hot.accept(['./JobService'], () => {
		destroyService()
		start()
	})
	
	module.hot.accept()
}