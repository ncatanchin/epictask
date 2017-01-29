

import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {decorateConstructor} from 'epic-global/Decorations'
import { makeInjector } from "../Inject"




const
	log = getLogger(__filename)




/**
 * Scope name
 *
 * @type {string}
 */
export const ServiceScope = "Service"


/**
 * Service Registry Scope
 */
export class ServiceRegistryScope implements IRegistryScope<IRegistryEntryService> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = ServiceScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Injector map
	 */
	private injectors
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(ServiceScope)
		this.injectors = Inject[ServiceScope] || (Inject[ServiceScope] = {} as any)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:IToolRegistration,target:any) {
		this.registerService(id,target)
	}
	
	/**
	 * Remove a component from the scope
	 *
	 * @param id
	 */
	unregister(id:string) {
		
	}
	
	
	/**
	 * Auto register a class
	 * so it can be dynamically recreated in revivers etc
	 *
	 * @param target
	 */
	Register = <T extends IServiceConstructor>(target:T):T => {
		const
			clazzName = target.ServiceName || target.name
		
		
		log.info(`Registering model: ${clazzName}`)
		
		
		this.registerService(clazzName,target)
		
		return target
	}
	
	Unregister = <T extends IServiceConstructor>(target:T):void => {
		const
			clazzName = target.ServiceName || target.name
		
		
		log.info(`Registering model: ${clazzName}`)
		
		
		this.registerService(clazzName,target)
		
		
	}
	
	
	
	/**
	 * Manual register a clazz
	 *
	 * @param name
	 * @param clazz
	 */
	registerService<T>(name,clazz:IServiceConstructor) {
		log.debug(`Registering service: ${name}`)
		
		let
			service = this.scope[name]
		
		if (service) {
			Object.setPrototypeOf(service, clazz.prototype)
		} else {
			this.scope[name] = new clazz()
		}
		
		this.injectors[name] = makeInjector(ServiceScope,name)
		
	}
	
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param name
	 * @returns {any}
	 */
	getService(name):any {
		return this.scope[name]
	}
	
}


/**
 * Declare the constant scope name
 */

const
	serviceRegistryScope = getHot(module,'hotInstance',new ServiceRegistryScope())


declare global {
	
	const enum ServiceStatus {
		Created = 1,
		Initialized,
		Started,
		Stopped,
		Destroyed
	}
	
	interface IServiceRegistration {
		proxy:IVariableProxy<IService>
		serviceConstructor:IServiceConstructor
		service:IService
		name:string
		loaded:boolean
	}
	
	/**
	 * IServices
	 *
	 * @class IServices
	 * @constructor
	 **/
	interface IService {
		
		status?:() => ServiceStatus
		
		/**
		 * All services that this service depends on
		 */
		dependencies?:() => IServiceConstructor[]
		
		/**
		 * Initialize the service, called before dependency analysis
		 */
		init?:() => Promise<this>
		
		/**
		 * Start the service
		 */
		start?:() => Promise<this>
		
		/**
		 * Stop the service
		 */
		stop?:() => Promise<this>
		
		/**
		 * Destroy the service
		 */
		destroy?:() => this
		
	}
	
	
	interface IServiceConstructor {
		ServiceName:string
		getInstance?:() => IService
		new ():IService
	}
	
	interface IRegistryEntryService extends IRegistryEntry<IServiceConstructor> {
	
	}
	
	namespace Scopes {
		namespace Services {
			function Register(target:IServiceConstructor)
			
			function Unregister(target:IServiceConstructor)
		}
	}
	
}

assignGlobal({
	ServiceRegistryScope: serviceRegistryScope
})

Scopes.Services = serviceRegistryScope
Registry.addScope(serviceRegistryScope)



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, ServiceRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: serviceRegistryScope}))
	
	// ACCEPT SELF
	acceptHot(module, log)
}
export {}