const log = getLogger(__filename)

// Get the DBService starter
import * as DBServiceType from './db/DB'
import * as ContextUtilsType from 'shared/util/ContextUtils'
import * as StoreType from 'shared/store'

let services = []

function shutdown() {
	return Promise.all(
		services.map(service => service.stop ?
			service.stop() : Promise.resolve(true)
		)
	).then(() => {
		if (services.length)
			log.info('All services are shutdown')

	}).catch(err => {
		log.error('service shutdowns failed',err)
	})
}

let bootPromise = null

async function boot():Promise<any> {

	// Just in case this is an HMR reload
	await shutdown()
	services = []

	// Load dependencies
	const DBService:typeof DBServiceType = require('./db/DB.ts')
	const ContextUtils:typeof ContextUtilsType = require('shared/util/ContextUtils')

	/**
	 * Load the database FIRST
	 */
	log.info('Starting Database')
	await DBService.start()

	/**
	 * Find all services
	 */
	log.info('Starting services')
	const Services = ContextUtils.requireContext(
		require.context('shared/actions',true,/Service\.ts/),
		[],
		true
	)

	const serviceKeys = Object.keys(Services)
	log.info('Discovered available services:', serviceKeys)

	/**
	 * Load all available services
	 */
	log.info('Waiting for all services to load')
	for (let serviceKey of serviceKeys) {
		log.info(`Starting service: ${serviceKey}`)
		const service = Services[serviceKey]
		if (service.start) {
			log.info(`Starting Service ${serviceKey}`)
			await service.start()
		} else {
			log.info(`Started Service ${serviceKey} (No start event)`)
		}
	}



	return Services
}

export = function() {
	return (bootPromise = boot())
}

/**
 * If HMR is enabled then sign me up
 */
if (module.hot) {
	module.hot.accept(['./db/DB','shared/util/ContextUtils'], updates => {
		log.info('HMR updates received - rebooting', updates)

		log.info('Appending another boot onto the boot promise')

		if (bootPromise)
			bootPromise.then(boot)
	})

	module.hot.dispose(() => {
		bootPromise = null
	})

}