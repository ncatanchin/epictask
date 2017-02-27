import {Map,List,Record} from 'immutable'
import { Coordinator as TSCoordinator, Repo as TSRepo } from 'typestore'
import { isNil, isFunction } from "typeguard"
import { PouchDBPlugin as TSPouchDBPlugin } from "typestore-plugin-pouchdb"

// export enum PluginStatus {
// 	Processed = 1,
// 	Updating = 2,
// 	Running = 3,
// 	Stopped = 4
// }
//
// assignGlobal({
// 	PluginStatus
// })



/**
 * Plugin Shape
 */
declare global {
	
	interface IPluginModelDescriptor {
		model:string
		store:string
	}
	
	interface IPluginModelDescriptors {
		[name:string]:IPluginModelDescriptor
	}
	
	interface IPluginPackageDescriptor {
		name: string
		version:string
		description?:string
		epictask:IPluginDescriptor
	}
	
	interface IPluginDescriptor {
		main: string
		models?:IPluginModelDescriptors
	}
	
	interface IPluginConfig {
		
		/**
		 * Plugin descriptor
		 */
		descriptor:IPluginDescriptor
		
		
		/**
		 * Location of the plugin
		 */
		dirname:string
		
		/**
		 * Unique name
		 */
		name:string
		
		/**
		 * Description
		 */
		description?:string
		
		/**
		 * Store location of plugin
		 */
		storeDirname:string
		
		/**
		 * The semver version
		 */
		version:string
		
		/**
		 * Entry file (main in package.json)
		 */
		main:string
		
		/**
		 * in dev mode
		 */
		inDevMode?:boolean
		
		
		/**
		 * Packaged/Un-packaged
		 */
		isZip:boolean
		
		
		/**
		 * Source filename dir or zip filename
		 */
		filename:string
		
		/**
		 * Last updated/modified timestamp
		 */
		updatedAt:number
	}
	
	
	/**
	 * Plugin config
	 */
	interface IPlugin extends IPluginConfig {
		
		entry?: any
		
		/**
		 * Execute when loaded from filesystem
		 */
		load?:() => Promise<IPlugin>
		
		/**
		 * Execute on unload
		 */
		unload?:() => Promise<IPlugin>
		
		/**
		 * Start the plugin
		 */
		start():Promise<IPlugin>
		
		/**
		 * Stop the plugin
		 */
		stop():Promise<IPlugin>
		
		/**
		 * Data store context
		 */
		dataContext?:IPluginStoreContext
	}
	
	/**
	 * Plugin store context
	 */
	interface IPluginStoreContext {
		name:string
		internal:{
			coordinator:TSCoordinator
			storePlugin:TSPouchDBPlugin
		}
		stores:{
			[modelName:string]:TSRepo<any>
		}
	}
	
	const enum PluginStatus {
		Processed = 1,
		Updating = 2,
		Running = 3,
		Stopped = 4
	}
	
	interface IPluginState extends Map<string,any> {
		config:IPluginConfig
		processStatus:Map<string,PluginStatus>
	}
	
	interface IPluginModelStoreConfig {
		name:string,
		model:any,
		store:any
	}
}

export {}