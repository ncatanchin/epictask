const log = getLogger(__filename)

import {ObservableStore} from 'typedux'
import {Singleton, AutoWired, Container} from 'typescript-ioc'
import {IService, ServiceStatus} from './services/IService'

// Get the DBService starter
import DBService from './services/DBService'
import * as ContextUtils from 'shared/util/ContextUtils'

let hmrReady = false

@AutoWired
@Singleton
export class MainConfigurator {
	services:{[key:string]:IService} = {}
	servicesCtx = null

	loadServices() {
		this.servicesCtx = require.context('main/services',true,/^((?!DBService|IService)[\S\s]).*Service\.ts$/)
		log.info(`Services Context has keys: ${this.servicesCtx.keys().join(', ')}`)

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

			this.services[serviceKey] = service

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
		if (module.hot && !hmrReady) {
			hmrReady = true
			module.hot.accept([this.servicesCtx.id], async (updates) => {
				log.info('HMR Services updated: ', updates)
				await Promise.all(Object.values(this.services)
					.map(service => (
						(service.stop) ? service.stop() : Promise.resolve(service))
					))

				await this.startServices()

				log.info('HMR services reloaded')
			})
		}

		return Services
	}

	async init():Promise<this> {
		// Load Redux-Store FIRST
		log.info('Loading the REDUX store')
		const store:ObservableStore<any> = await require('shared/store').loadAndInitStore()
		Container.bind(ObservableStore).provider({ get: () => store})

		return this
	}

	async start():Promise<any> {

		// Just in case this is an HMR reload
		await this.stop()




		// Load the database first
		log.info('Starting Database')
		const dbService = Container.get(DBService)
		await dbService.init()
		await dbService.start()



		log.info('DB loaded, now services')
		return await this.startServices()
	}

	stop() {
		const services = Object.values(this.services)

		const stopPromises = services
			.map(service => service.stop ?
				service.stop() : Promise.resolve(service)
			) as Promise<IService>[]

		return Promise.all(stopPromises).then(() => {
			if (services.length)
				log.info('All services are shutdown')

		}).catch(err => {
			log.error('service shutdowns failed', err)
		})
	}

}


export default MainConfigurator