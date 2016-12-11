

import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {decorateConstructor} from 'epic-global/Decorations'
import { makeInjector } from "../Inject"




const
	log = getLogger(__filename)


/**
 * Global declarations
 */
declare global {
	
	interface IServiceConstructor {
		ServiceName?:string
		new ():any
	}
	
	interface IRegistryEntryService extends IRegistryEntry<IServiceConstructor> {
		
	}
}


/**
 * Scope name
 *
 * @type {string}
 */
export const ServiceScope = "Service"


/**
 * Service Registry Scope
 */
class ServiceRegistryScope implements IRegistryScope<IRegistryEntryService> {
	
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
	namespace ServiceRegistryScope {
		function Register(target:any)
	}
	
	namespace RegistryScope {
		let Service:ServiceRegistryScope
	}
}

assignGlobal({
	ServiceRegistryScope: serviceRegistryScope
})

RegistryScope.Service = serviceRegistryScope
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