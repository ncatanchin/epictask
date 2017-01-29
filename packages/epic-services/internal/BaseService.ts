


/**
 * Base service implementation
 */
export abstract class BaseService implements IService {
	
	/**
	 * Internal status value
	 *
	 * @type {ServiceStatus}
	 * @private
	 */
	protected _status:ServiceStatus = ServiceStatus.Created
	
	/**
	 * is the service running
	 *
	 * @returns {boolean}
	 */
	get isRunning() {
		return this._status < ServiceStatus.Stopped
	}
	
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
