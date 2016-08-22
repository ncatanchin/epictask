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
 * IServices
 *
 * @class IServices
 * @constructor
 **/
export interface IService {

	status():ServiceStatus

	init?():Promise<this>
	start():Promise<this>
	stop?():Promise<this>
	destroy?():this

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
		// assert(status >= this._status,`Current status is further than requested status:
		// 	${statusString(status)} / current status is ${statusString(this._status)}`)

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