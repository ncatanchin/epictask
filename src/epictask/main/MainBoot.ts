const log = getLogger(__filename)

// Get the DBService starter
import * as DBServiceType from 'shared/DB'
import * as ContextUtilsType from 'shared/util/ContextUtils'

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

async function boot():Promise<any> {

	// Just in case this is an HMR reload
	await shutdown()
	services = []

	// Load dependencies
	const DBService:typeof DBServiceType = require('shared/DB')
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
	const servicePromises = serviceKeys
		.map(serviceKey => {
			log.info(`Starting service: ${serviceKey}`)
			const service = Services[serviceKey]
			return (service.start) ? service.start() : Promise.resolve(service)
		})

	log.info('Waiting for all services to load')
	servicePromises.forEach(async(service) => await service)

}

const bootPromise = boot()

export = bootPromise

/**
 * If HMR is enabled then sign me up
 */
if (module.hot) {
	module.hot.accept(['shared/DB','shared/util/ContextUtils'], updates => {
		log.info('HMR updates received - rebooting', updates)

		log.info('Appending another boot onto the boot promise')
		bootPromise.then(boot)
	})
}