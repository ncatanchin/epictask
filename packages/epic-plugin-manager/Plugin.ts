
import { isNil, isFunction } from "typeguard"

/**
 * Validate a plugin is valid
 *
 * @param o
 * @returns {boolean}
 */
export function validatePlugin(o:any):o is IPlugin {
	return !isNil(o) &&
		['name','version','context'].every(prop => o.hasOwnProperty(prop)) &&
		['start','stop'].every(it => isFunction(o[it]))
}

/**
 * Plugin Shape
 */
declare global {
	interface IPlugin {
		
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
		 * Main entry filename
		 */
		main:string
		
		/**
		 * The semver version
		 */
		version:string
		
		/**
		 * Entry file (main in package.json)
		 */
		entry:string
		
		/**
		 * in dev mode
		 */
		inDevMode?:boolean
		
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
}

export {}