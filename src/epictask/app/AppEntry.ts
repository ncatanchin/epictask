// Load all global/env stuff first
import './AppGlobals'

// Load logger
const log = getLogger(__filename)

// Load Styles
import './styles'

// Get the DBService starter
import * as DBService from 'shared/DBService'
import * as Services from 'app/services'

async function boot() {


	log.info('Starting Database')
	await DBService.start()


	log.info('Starting services')
	const servicePromises = Object.keys(Services)
		.map(serviceKey => Services[serviceKey].start())

	log.info('Waiting for all services to load')
	await Promise.all(servicePromises)

	log.info('Loading app root')
	const loadAppRoot = () => require('./components/root/AppRoot.tsx')
	loadAppRoot()




	if (module.hot) {
		module.hot.accept(['./components/root/AppRoot.tsx'], (updates) => {
			log.info('HMR Updates, reloading app content',updates)
			loadAppRoot()
		})

		module.hot.accept()
		module.hot.dispose(() => {
			log.info('HMR AppEntry Update')
		})
	}
}


boot().then(() => log.info('Booted App'))