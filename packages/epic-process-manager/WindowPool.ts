import { Map, Record, List } from "immutable"
import WindowFactory from "epic-process-manager/WindowFactory"
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global"
import * as Pool from 'generic-pool'
import { WindowConfigDefaults } from "epic-process-manager-client"
import { isNumber } from "typeguard"

/**
 * Created by jglanz on 12/5/16.
 */

const
	log = getLogger(__filename)
	
// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const DefaultPoolOpts = {
	
}

/**
 * generic-pool wrapper for windows
 */
export class WindowPool {
	
	private pool:Pool.Pool<IWindowInstance>
	
	private factory:WindowFactory
	
	constructor(
		public id:string,
		public processType:ProcessType,
		public opts:Electron.BrowserWindowOptions,
		public poolOpts:Pool.Options = DefaultPoolOpts
	) {
		this.factory = new WindowFactory(id,processType,opts)
		this.pool = Pool.createPool(this.factory,poolOpts)
	}
	exit
	/**
	 * Get a window instance to use
	 *
	 * @returns {Promise<T>}
	 */
	acquire():Promise<IWindowInstance> {
		return this.pool.acquire()
	}
	
	/**
	 * Release a window instance
	 *
	 * @returns {Promise<T>}
	 */
	release(instance:IWindowInstance):Promise<void> {
		return this.pool.release(instance)
	}
	
	/**
	 * Release a window instance
	 *
	 * @returns {Promise<T>}
	 */
	destroy(instance:IWindowInstance):Promise<void> {
		return this.pool.destroy(instance)
	}
	
	/**
	 * Drain the pool
	 */
	drain():Promise<void> {
		return this.pool.drain()
	}
	
	/**
	 * If you know you would like to terminate all the available resources in your pool before any timeouts they might have are reached, you can use `clear()` in conjunction with `drain()`:
	 *
	 * ```
	 * pool.drain().then(() => pool.clear());
	 * ```
	 */
	clear():Promise<void> {
		return this.pool.clear()
	}
	
}

export namespace WindowPool {
	
	const
		pools = getHot(module,'pools',Map<string,WindowPool>().asMutable())
	
	// SUPPORT HMR
	setDataOnHotDispose(module,() => ({
		pools
	}))
	
	/**
	 * Create a pool id
	 *
	 * @param windowType
	 * @param processType
	 * @returns {string}
	 */
	function makePoolId(windowType:WindowType,processType:ProcessType) {
		return `${WindowType[windowType]}-${ProcessType[processType]}`
	}
	
	
	/**
	 * Get/create a pool
	 *
	 * @param windowType
	 * @param processType
	 */
	export function get(windowType:WindowType,processType:ProcessType) {
		const
			poolId = makePoolId(windowType,processType)
		
		if (pools.has(poolId))
			return pools.get(poolId)
		
		log.debug(`Creating pool id: ${poolId}`)
		
		let
			pool = new WindowPool(poolId,processType,WindowConfigDefaults[windowType].opts)
		
		pools.set(poolId,pool)
		
		return pool
	}
	
	
}


export default WindowPool

// HMR
acceptHot(module)