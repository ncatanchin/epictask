import {setDataOnHotDispose, getHot, acceptHot } from  "epic-global/HotUtils"
import {VariableProxy} from 'epic-util'
import { getValue, isFunction } from "typeguard"



const log = getLogger(__filename)


/**
 * Reference for the singleton instance
 *
 * @type {any}
 */
let serviceManager:ServiceManager = null

/**
 * Persistent Proxy Object
 */
let serviceManagerProxy:VariableProxy<ServiceManager> = getHot(module,'serviceManagerProxy') as any


export type TServiceRegistrationMap = {[name:string]:IServiceRegistration}

/**
 * Simple accessor to singleton
 *
 * @returns {ServiceManager}
 */
export function getServiceManager() {
	return ServiceManager.getInstance()
}

/**
 * Service Manager for starting/stopping/loading/reloading all services
 */
export class ServiceManager {
	
	
	/**
	 * Get singleton
	 *
	 * @returns {ServiceManager}
	 */
	static getInstance():ServiceManager {
		if (!serviceManager) {
			serviceManager = new ServiceManager()
			
			if (!serviceManagerProxy) {
				log.info('Creating service manager proxy')
				serviceManagerProxy = new VariableProxy(ServiceManager as any,serviceManager)
			}
			
			Container.bind(ServiceManager).provider({
				get: () => serviceManagerProxy.handler
			})
		}
		return serviceManager
	}
	
	/**
	 * Internal variable proxy map
	 *
	 * @type {{}}
	 */
	private registrations:TServiceRegistrationMap = {}
	
	/**
	 * Pending registrations
	 */
	private pendingServices:IServiceRegistration[] = []
	
	/**
	 * A deferred promise ref
	 */
	private pendingProcess:Promise.Resolver<any>
	
	/**
	 * Only really used in HMR scenarios
	 *
	 * @type {boolean}
	 */
	private stopped = false
	
	/**
	 * Only really used in HMR scenarios
	 *
	 * @type {boolean}
	 */
	private started = false
	
	/**
	 * Context ref for testing
	 */
	public ctxRef
	
	/**
	 * Started and not stopped = running
	 *
	 * @returns {boolean}
	 */
	get running() {
		return this.started && !this.stopped
	}
	
	
	private constructor() {
		
	}
	
	
	/**
	 * Clear the existing registrations
	 */
	clearInTestOnly() {
		if (!process.env.EPIC_TEST)
			throw new Error('This ONLY works in TEST mode')
		
		this.registrations = {}
	}
	
	
	/**
	 * Load and start all modules
	 */
	async start(...specificServices:IServiceConstructor[]) {
		if (this.started) {
			log.warn('Already running')
			return
		}
		
		this.stopped = false
		this.started = true
		try {
			if (specificServices.length) {
				specificServices.forEach(serviceConstructor => this.register(serviceConstructor))
				await this.processPendingServices()
			} else {
				await this.loadModules()
			}
		} catch (err) {
			log.error(`Failed to start services`,err)
			this.started = false
		}
	}
	
	/**
	 * Stop all loaded services, HMR only & shutdown
	 */
	async stop() {
		if (this.stopped) {
			log.warn('already stopped')
			return
		} else if (!this.running) {
			log.warn('not running, so cant stop')
			return
		}
			
		this.stopped = true
		this.started = false
		
		for (let reg of Object.values(this.registrations)) {
			log.info(`Stopping ${reg.name}`)
			try {
				if (reg.service.stop) {
					await reg.service.stop()
				}
				reg.loaded = false
			} catch (err) {
				log.error(`Failed to shutdown: ${reg.name}`,err)
			}
		}
		
		this.registrations = {}
		
	}
	
	/**
	 * Get the registration map
	 *
	 * @returns {{}}
	 */
	getRegistrationMap() {
		return this.registrations
	}
	
	/**
	 * Get list of ServiceRegistration's in load order
	 *
	 * @param filterServiceConstructors - optionally filter specific services
	 */
	getRegistrations(...filterServiceConstructors:IServiceConstructor[]) {
		const
			regs:IServiceRegistration[] = Object.values(this.registrations),
			orderedRegs:IServiceRegistration[] = [],
			finished = () => regs.length === orderedRegs.length
		
		while (!finished()) {
			const nextReg:IServiceRegistration = regs
				.filter((reg:IServiceRegistration) => orderedRegs.includes(reg) === false)
				.find((reg:IServiceRegistration) => reg.service
						.dependencies()
						.every(dep => orderedRegs.includes(this.registrations[dep.name]))
				)
			
			if (!nextReg){
				//noinspection ExceptionCaughtLocallyJS
				throw new Error('No reg that has all deps satisfied')
			}
			
			orderedRegs.push(nextReg)
		}
		
		return !filterServiceConstructors.length ?
			orderedRegs :
			orderedRegs.filter(reg => filterServiceConstructors.includes(reg.serviceConstructor))

	}
	
	/**
	 * Register a service
	 *
	 * @param serviceConstructor
	 */
	register(serviceConstructor:IServiceConstructor) {
		
		let
			{name,ServiceName} = serviceConstructor
		
		if (ServiceName)
			name = ServiceName
		
		// Check for existing reg
		const reg:IServiceRegistration = this.registrations[name]
		
		if (reg && reg.serviceConstructor === serviceConstructor) {
			log.info(`Re-registering service with same constructor: ${name} - IGNORED`,serviceConstructor)
			return
		}
		
		if (reg) {
			if (module.hot) {
				log.info(`Hot reloading ${name} - have to stop it first`)
				try {
					log.info(`Stopping ${name}`)
					reg.proxy.handler.stop()
					log.info(`Stopped ${name} - may be 'stopping' if async`)
				} catch (err) {
					log.error(`Failed to stop existing service ${name} - let's pray`, err)
				}
			} else {
				throw new Error(`HMR is not enabled, but we are reloading a service, WTF: ${name}`)
			}
		}
		
		const
			service:IService = serviceConstructor.getInstance ?
				serviceConstructor.getInstance() :
				new serviceConstructor(),
			proxy = (reg) ?
				reg.proxy.setTargets(serviceConstructor,service) :
				new VariableProxy(serviceConstructor,service)
		
		
		
		// Push the reg to the pile as pending
		_.remove(this.pendingServices,it => it.name === name)
		
		// Add the new reg to the pending list
		const
			hasLifecycle = isFunction(service.init) || isFunction(service.start),
			serviceReg = this.registrations[name] = {
				name,
				proxy,
				service,
				serviceConstructor,
				loaded: !hasLifecycle
			}
			
		if (hasLifecycle)
			this.pendingServices.push(serviceReg)
	}
	
	
	/**
	 * Load the service context
	 *
	 * @returns {any}
	 */
	async loadModules() {
		if (this.stopped) {
			log.warn('Service manager has been stopped, can not load')
			return
		}
			
		await this.processPendingServices()
	}
	
	
	/**
	 * Get service status, when available, otherwise running
	 *
	 * @param service
	 */
	getServiceStatus(service:IService) {
		return getValue(() => service.status(),ServiceStatus.Created)
	}
	
	/**
	 * Get a service instance
	 *
	 * @param name
	 * @returns {IService}
	 */
	getService(name:string):IService {
		const
			reg = this.registrations[name]
		
		assert(reg,`Unknown service name: ${name}`)
		return reg.service
	}
	
	/**
	 * Process all pending services
	 */
	private async processPendingServices() {
		if (this.pendingProcess)
			await this.pendingProcess.promise
		
		const pendingServices = [..._.uniqBy(this.pendingServices, 'name')]
		
		let
			nextReg:IServiceRegistration = null
		
		try {
			this.pendingProcess = Promise.defer()
			
			// now clear the root list
			this.pendingServices.length = 0
			
			const allLoaded = () => pendingServices.every(it => it.loaded)
			
			log.info(`Loading Services ${pendingServices.map(service => service.name).join(', ')}`,allLoaded())
			
			while (!allLoaded()) {
				nextReg = pendingServices.find(it => {
					const
						deps = getValue(() => it.service.dependencies(),[])
					
					return deps.length === 0 || deps.every(reg => getValue(() => this.registrations[reg.name].loaded,true))
				})
				
				if (!nextReg){
					//noinspection ExceptionCaughtLocallyJS
					throw new Error('No available reg that has all deps satisfied')
				}
				
				
				
				if (this.getServiceStatus(nextReg.service) > ServiceStatus.Created) {
					//noinspection ExceptionCaughtLocallyJS
					throw new Error(`Can not init & start a service that is not in the Created state: ${nextReg.name} / ${nextReg.service.status()}`)
				}
				
				log.info(`Init ${nextReg.name}`)
				if (isFunction(nextReg.service.init))
					await nextReg.service.init()
				
				log.info(`Starting ${nextReg.name}`)
				if (isFunction(nextReg.service.start))
					await nextReg.service.start()
				
				log.info(`Loaded successfully ${nextReg.name}`)
				nextReg.loaded = true
				
				_.remove(pendingServices,it => it === nextReg)
				nextReg = null
				
				
			}
		} catch (err) {
			log.error(`Failed to loaded ${nextReg && nextReg.name}, all pending (${pendingServices.map(it => it.name).join(',')}) `,err)
		} finally {
			this.pendingProcess.resolve()
			this.pendingProcess = null
		}
	}
}

// HMR
setDataOnHotDispose(module,() => ({
	serviceManagerProxy
}))

acceptHot(module,log)
