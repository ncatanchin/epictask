import {VariableProxy} from  "epic-global/VariableProxy"

/**
 * Service state
 */


export enum ServiceStatus {
	Created = 1,
	Initialized,
	Started,
	Stopped,
	Destroyed
}


/**
 * IService Constructor interface
 */
export interface IServiceConstructor {
	new ():IService
	getInstance?:() => IService
}

/**
 * IServices
 *
 * @class IServices
 * @constructor
 **/
export interface IService {
	
	status():ServiceStatus
	
	/**
	 * All services that this service depends on
	 */
	dependencies():IServiceConstructor[]
	
	/**
	 * Initialize the service, called before dependency analysis
	 */
	init():Promise<this>
	
	/**
	 * Start the service
	 */
	start():Promise<this>
	
	/**
	 * Stop the service
	 */
	stop():Promise<this>
	
	/**
	 * Destroy the service
	 */
	destroy():this
	
}


/**
 * Registered Service
 */
export interface IServiceRegistration {
	proxy:VariableProxy<IService>
	serviceConstructor:IServiceConstructor
	service:IService
	name:string
	loaded:boolean
}
