const log = getLogger(__filename)

import {ObservableStore} from 'typedux'
import {Singleton, AutoWired, Container} from 'typescript-ioc'
import {IService, ServiceStatus} from './services/IService'

// Get the DBService starter
import DBService from 'main/services/DBService'
import * as ContextUtils from 'shared/util/ContextUtils'

@AutoWired
@Singleton
export class MainConfigurator {
	services:IService[] = []
	servicesCtx = null

	loadServices() {
		this.servicesCtx = require.context('main/services',true,/^(?!DBService|IService).*Service\.ts$/)
	}

	/**
	 * Start all services
	 *
	 * @returns {{}}
	 */
	async startServices() {
		log.info('Starting services')

		this.loadServices()
		const Services = ContextUtils.requireContext(
			this.servicesCtx,
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
			if (['DBService','IService'].includes(serviceKey))
				continue

			log.info(`Starting service: ${serviceKey}`)
			let service = Services[serviceKey]

			if (service.default) {
				service = Container.get(service.default)
			}

			if (service.status > ServiceStatus.Created) {
				log.info(`${serviceKey} was already started, skipping`)
				continue
			}

			const isService = !!service.status && !!service.start
			assert(isService,"Services does not appear to implement IService")

			if (service.init) {
				log.info(`Init Service ${serviceKey}`)
				await service.init()
			}

			if (service.start) {
				log.info(`Starting Service ${serviceKey}`)
				await service.start()
			} else {
				log.info(`Started Service ${serviceKey} (No start event)`)
			}
		}


		// HMR
		if (module.hot) {
			module.hot.accept([this.servicesCtx.id], updates => {
				log.info('HMR Services updated: ', updates)
			})
		}

		return Services
	}

	async init():Promise<this> {
		// Load Redux-Store FIRST
		log.info('Loading the REDUX store')
		const store:ObservableStore<any> = require('shared/store').initStore()
		Container.bind(ObservableStore).provider({ get: () => store})

		return this
	}

	async start():Promise<any> {

		// Just in case this is an HMR reload
		await this.stop()
		this.services = []



		// Load the database first
		log.info('Starting Database')
		const dbService = Container.get(DBService)
		await dbService.init()
		await dbService.start()



		log.info('DB loaded, now services')
		return await this.startServices()
	}

	stop() {
		const stopPromises =
			this.services.map(service => service.stop ?
				service.stop() : Promise.resolve(service)
			) as Promise<IService>[]

		return Promise.all(stopPromises).then(() => {
			if (this.services.length)
				log.info('All services are shutdown')

		}).catch(err => {
			log.error('service shutdowns failed', err)
		})
	}

}


export default MainConfigurator