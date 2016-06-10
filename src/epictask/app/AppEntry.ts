require('shared/SourceMapSupport')
import 'reflect-metadata'
import './AppLogging'

// Get the DBService starter
import * as DBService from '../shared/DB'

async function boot() {
	// Load all global/env stuff first
	require('./AppGlobals')

	// Load logger
	const log = getLogger(__filename)

	// Load Styles
	require('./styles')


	log.info('Starting Database')
	await DBService.start()




	log.info('Starting services')
	const Services = require('app/services')
	const servicePromises = Object.keys(Services)
		.map(serviceKey => Services[serviceKey].start())

	log.info('Waiting for all services to load')
	servicePromises.forEach(async (service) => await service)

	// Now the theme manager
	require("./ThemeManager.tsx")

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


boot().then(() => console.log('Booted App'))