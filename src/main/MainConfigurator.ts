const log = getLogger(__filename)

import {AutoWired} from 'typescript-ioc'
import {IService, ServiceStatus} from 'services/IService'

// Get the DBService starter

import * as ContextUtils from 'shared/util/ContextUtils'
import storeBuilder from 'shared/store/AppStoreBuilder'

let hmrReady = false

// SERVICES WE CAN NOT LOAD
const IllegalServices = [/DBService/,/IService$/]

export type TServiceMap = {[key:string]:IService}

@AutoWired
export class MainConfigurator {
	private requestedServices:any[]

	services:{[key:string]:IService} = {}
	servicesCtx = null
	

	constructor() {

	}
	/**
	 * Load services context
	 *
	 * @returns {{}}
	 */
	private loadServices():TServiceMap {
		this.servicesCtx = require.context('main/services',true,/^((?!.*(DBService|IService).*)[\S\s]).*Service\.ts$/)
		log.info(`Services Context has keys: ${this.servicesCtx.keys().join(', ')}`)

		const ctx =  ContextUtils.requireContext(
			this.servicesCtx,
			[],
			true
		)

		const serviceKeys = Object.keys(ctx)
		log.info('Discovered available services:', serviceKeys)


		// Test valid keys
		IllegalServices.forEach(illegal => {
			serviceKeys.forEach(key => {
				assert(!illegal.test(key),`Illegal service (${key}).  This service can not be loaded automatically 
					and regex tests should be updated - ${illegal.source}`)
			})
		})

		return serviceKeys
			.reduce((services,key) => {
				const
					serviceMod = ctx[key],
					serviceClazz = serviceMod.default || serviceMod,
					serviceInstance = new serviceClazz()

				Container.bind(serviceClazz).provider({
					get: () => serviceInstance
				})

				assert(
					serviceClazz.name,
					'Service MUST have name'
				)
				services[serviceClazz.name] = serviceInstance
				return services
			},{})

	}

	/**
	 * Load specific services provided, if none are
	 * provided then all services are loaded
	 *
	 * @returns {any|{}}
	 */
	private loadRequestedServices():TServiceMap {
		return this.requestedServices.reduce((services,serviceClazz) => {
			const serviceInstance = new serviceClazz()
			Container.bind(serviceClazz).provider({get: () => serviceInstance})
			services[serviceClazz.name] = serviceInstance
			return services
		},{})
	}

	/**
	 * Start all services
	 *
	 * @returns {{}}
	 */
	async startServices() {
		log.info('Starting services')


		const services = (this.requestedServices.length) ?
			this.loadRequestedServices() :
			this.loadServices()





		/**
		 * Load all available services
		 */
		log.info('Waiting for all services to load')
		for (let serviceKey of Object.keys(services)) {


			log.info(`Starting service: ${serviceKey}`)
			let service = services[serviceKey]

			this.services[serviceKey] = service

			if (service.status() > ServiceStatus.Created) {
				log.warn(`${serviceKey} was already started, skipping`)
				continue
			}

			const isService = !!service.status && !!service.start


			assert(isService,"Services does not appear to implement IService: " + service.status + '/' + typeof service.start)

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
		this.hmrSetup()

		return this.services
	}

	

	/**
	 * Initialize the main config
	 *
	 * @param requestedServices
	 * @returns {MainConfigurator}
	 */
	async init(...requestedServices:any[]):Promise<this> {

		// Set services
		this.requestedServices = requestedServices

		// Load Redux-Store FIRST
		log.info('Loading the REDUX store')
		await storeBuilder()

		return this
	}


	/**
	 * Start all the services
	 *
	 * @returns {any}
	 */
	async start():Promise<any> {

		// Just in case this is an HMR reload
		await this.stop()

		
		log.info('DB loaded, now services')
		return await this.startServices()
	}

	/**
	 * Stop all the services
	 *
	 * @returns {Promise<T>|Promise<T|U>}
	 */
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

	private hmrSetup() {
		if (module.hot && !hmrReady) {
			hmrReady = true


			if (this.servicesCtx) {
				module.hot.accept([this.servicesCtx.id], async(updates) => {
					log.info('HMR Services updated: ', updates)
					await Promise.all(Object.values(this.services)
						.map(service => (
							(service.stop) ? service.stop() : Promise.resolve(service))
						))

					await this.startServices()

					log.info('HMR services reloaded')
				})
			}
		}
	}

}


export default MainConfigurator