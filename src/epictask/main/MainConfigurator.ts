const log = getLogger(__filename)

// Get the DBService starter
import * as DBServiceType from './db/DB'
import * as ContextUtilsType from 'shared/util/ContextUtils'

let services = []
let servicesCtx = null

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


/**
 * Find all services
 */
function loadServices() {
	servicesCtx = require.context('shared/actions',true,/Service\.ts/)
}

loadServices()

async function startServices() {
	log.info('Starting services')

	const ContextUtils:typeof ContextUtilsType = require('shared/util/ContextUtils')

	const Services = ContextUtils.requireContext(
		servicesCtx,
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

/**
 * Initialize and load store
 */
export async function init():Promise<any> {
	log.info('Loading the REDUX store')
	const {createStore} = require('shared/store')
	await createStore()
	log.info('Store built')
}

/**
 * Start the app
 *
 * @returns {any}
 */
export async function start():Promise<any> {

	// Just in case this is an HMR reload
	await shutdown()
	services = []

	// Load dependencies
	const DBService:typeof DBServiceType = require('./db/DB.ts')


	/**
	 * Load the database FIRST
	 */
	log.info('Starting Database')
	await DBService.start()

	return await startServices()
}

/**
 * If HMR is enabled then sign me up
 */
if (module.hot) {
	// module.hot.accept(['shared/store','./db/DB','shared/util/ContextUtils',servicesCtx.id], updates => {
	// 	log.info('HMR updates received - rebooting', updates)
	//
	// 	loadServices()
	// 	init().then(start)
	//
	// })


}