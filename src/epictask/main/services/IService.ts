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
	Stopped
}

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