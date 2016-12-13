import { Map, Record, List } from "immutable"
import {BrowserWindow} from 'electron'
import WindowFactory from "epic-process-manager/WindowFactory"
import { getHot, setDataOnHotDispose, acceptHot, addHotDisposeHandler } from "epic-global"
import { WindowConfigDefaults } from "epic-process-manager-client/WindowConfig"
import { isNumber } from "typeguard"
import { Pool, IPoolOptions } from "typepool"


type BrowserWindow = Electron.BrowserWindow

/**
 * Created by jglanz on 12/5/16.
 */

const
	log = getLogger(__filename)
	
// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)



const
	
	/**
	 * Pool options for UI/Normal Windows
	 */
	NormalPoolOpts = {
		min: 1,
		testOnBorrow: true
	},
	
	/**
	 * WindowType -> Pool opts
	 */
	DefaultPoolOpts = {
		[WindowType.Background]: {
			testOnBorrow: true
		},
		[WindowType.Normal]: NormalPoolOpts,
		[WindowType.Dialog]: NormalPoolOpts,
		//[WindowType.Modal]: NormalPoolOpts
	},
	
	/**
	 * Default pool configs
	 *
	 * ProcessType -> [WindowType]
	 */
	DefaultPoolConfigs = {
		[ProcessType.UI]: [WindowType.Normal,WindowType.Modal,WindowType.Dialog]
		// [ProcessType.DatabaseServer]: [WindowType.Background],
		// [ProcessType.JobServer]: [WindowType.Background]
	}


/**
 * generic-pool wrapper for windows
 */
export class WindowPool extends Pool<BrowserWindow> {
	
	constructor(
		public id:string,
		public processType:ProcessType,
		public windowType:WindowType,
		opts:Electron.BrowserWindowOptions,
		poolOpts:IPoolOptions = DefaultPoolOpts
	) {
		super(new WindowFactory(id,processType,opts),poolOpts[windowType])
	}
		
}

export namespace WindowPool {
	
	const
		pools = getHot(module,'pools',Map<string,WindowPool>().asMutable())
	
	function destroyAll() {
		pools.valueSeq().forEach(pool => pool.drain())
	}
	
	process.on('beforeExit',destroyAll)
	
	
	// HMR
	setDataOnHotDispose(module,() => ({pools}))
	
	// HMR
	addHotDisposeHandler(module,() => process.removeListener('beforeExit',destroyAll))
	
	
	
	/**
	 * Create a pool id
	 *
	 * @param windowType
	 * @param processType
	 * @returns {string}
	 */
	function makePoolId(processType:ProcessType,windowType:WindowType) {
		return `${WindowType[windowType]}-${ProcessType[processType]}`
	}
	
	
	/**
	 * Get/create a pool
	 *
	 * @param windowType
	 * @param processType
	 */
	export function get(processType:ProcessType,windowType:WindowType) {
		const
			poolId = makePoolId(processType,windowType)
		
		if (pools.has(poolId))
			return pools.get(poolId)
		
		log.debug(`Creating pool id: ${poolId}`)
		
		let
			pool = new WindowPool(
				poolId,
				processType,
				windowType,
				WindowConfigDefaults[windowType].opts
			)
		
		pools.set(poolId,pool)
		
		return pool
	}
	
	
	
	// TYPE OF POOL CONFIG ENTRIES
	type TWindowConfigEntry = [ProcessType,Array<WindowType>]
	
	// ITERATE ALL DEFAULT POOL CONFIGS AND CREATE POOLS
	const
		configEntries:Array<TWindowConfigEntry> = Object.entries(DefaultPoolConfigs) as any
	
	configEntries
		.forEach(([processType,windowTypes]:TWindowConfigEntry) => {
			
			// PARSE REAL TYPE
			processType = isNumber(processType) ?
				processType :
				parseInt(processType,10) as any
			
			// CHECK TYPE
			ProcessConfig.assertType(processType)
			
			windowTypes.forEach(windowType => {
				log.debug(`Creating default pool ${makePoolId(processType,windowType)}`)
				get(processType,windowType)
			})
		})
	
	if (DEBUG) {
		assignGlobal({
			getWindowPools() {
				return pools.toJS()
			}
		})
	}
}



export default WindowPool

// HMR
acceptHot(module)