import {Map,List,Record} from 'immutable'
import { isNil, isFunction } from "typeguard"

export enum PluginStatus {
	Processed = 1,
	Updating = 2,
	Running = 3,
	Stopped = 4
}

assignGlobal({
	PluginStatus
})

/**
 * Plugin Shape
 */
declare global {
	interface IPluginConfig {
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
		
		enabled?:boolean
		
		isZip:boolean
		filename:string
		
	}
	
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
	}
	
	enum PluginStatus {
		Processed = 1,
		Updating = 2,
		Running = 3,
		Stopped = 4
	}
	
	interface IPluginState extends Map<string,any> {
		config:IPluginConfig
		processStatus:Map<string,PluginStatus>
	}
}

export {}