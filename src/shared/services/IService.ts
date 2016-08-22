/**
 * Created by jglanz on 7/4/16.
 */

const log = getLogger(__filename)

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
 * Retrieve text description of status
 *
 * @param status
 */
const statusString = (status:ServiceStatus) => ServiceStatus[status]

/**
 * IService Constructor interface
 */
export interface IServiceConstructor {
	new ():IService
}

/**
 * IServices
 *
 * @class IServices
 * @constructor
 **/
export interface IService {

	status():ServiceStatus
	
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




export abstract class BaseService implements IService {

	/**
	 * Internal status value
	 *
	 * @type {ServiceStatus}
	 * @private
	 */
	protected _status:ServiceStatus = ServiceStatus.Created


	/**
	 * Confirm the status is both not the desired status and is younger then
	 * the new status provided
	 *
	 * @param status
	 */
	protected confirmStatus(status:ServiceStatus) {
		this.status(status)
	}
	
	/**
	 * Base service management
	 *
	 * @param newStatus
	 * @returns {ServiceStatus}
	 */
	status(newStatus = this._status):ServiceStatus {
		if (!newStatus || newStatus === this._status)
			return this._status

		return this._status = newStatus
	}
	
	/**
	 * All services that this service depends on
	 *
	 * @returns {IServiceConstructor[]}
	 */
	dependencies():IServiceConstructor[] {
		return []
	}

	async init():Promise<this> {
		this.confirmStatus(ServiceStatus.Initialized)

		return this
	}

	async start():Promise<this> {
		this.confirmStatus(ServiceStatus.Started)
		return this
	}

	async stop():Promise<this> {
		this.confirmStatus(ServiceStatus.Stopped)
		return this
	}

	destroy():this {
		this.confirmStatus(ServiceStatus.Destroyed)
		return this
	}
}
