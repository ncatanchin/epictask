import { Map, Record, List } from "immutable"
import WindowFactory from "epic-process-manager/WindowFactory"
import { getHot } from "epic-global"
import * as Pool from 'generic-pool'

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
		public opts:Electron.BrowserWindowOptions,
		public poolOpts:Pool.Options = DefaultPoolOpts
	) {
		this.factory = new WindowFactory(id,opts)
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


export default WindowPool