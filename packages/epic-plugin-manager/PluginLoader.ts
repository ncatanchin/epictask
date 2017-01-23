import { Map, Record, List } from "immutable"
import shx = require('shelljs')
import decompress = require('decompress')

import { FileWatcherEvent, fileExists, cachePath, isDirectory, cloneObjectShallow } from "epic-global"


import * as Path from 'path'
import * as Fs from 'async-file'
import { isDefined, getValue, isFunction } from "typeguard"
import { unpackPluginZip } from "./PluginUtils"
import { PluginModuleLoader } from "./PluginModuleLoader"

const Module = require('module')

/**
 * Created by jglanz on 1/19/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

// Cache the plugin env
//nodeRequire.cache['epic-plugin-env'] = require('epic-plugin-env')

/**
 * Internal plugin rep
 */
export interface IPluginInternal extends IPlugin {
	module:PluginModuleLoader
}

/**
 * Lifecycle function
 */
export interface IPluginLifecycle {
	():Promise<IPlugin>
}


/**
 * Plugin
 *
 * @class Plugin
 * @constructor
 **/
export class PluginLoader {
	
	/**
	 * Get the JSON descriptor for a plugin
	 *
	 * @param filename
	 * @returns {Promise<null>}
	 */
	static async getPluginDescriptor(filename:string) {
		try {
			const
				pkgFilename = Path.resolve(filename,'package.json')
			
			if (!fileExists(pkgFilename))
				return null
			
			const
				pkgJson = await Fs.readFile(pkgFilename),
				pkg = JSON.parse(pkgJson)
				
			return pkg && pkg.epictaskPlugin && pkg.main ? pkg : null
		} catch (err) {
			return null
		}
	}
	
	/**
	 * Check if directory && if there is a package.json in there && epictask prop
	 *
	 * @param filename
	 * @returns {Promise<any|boolean>}
	 */
	static async isPluginDir(filename:string) {
		const
			isDir = (await Fs.stat(filename)).isDirectory()
		
		return (isDir) ?
			isDefined(await PluginLoader.getPluginDescriptor(filename)) :
			false
	}
	
	/**
	 * Determine if the file is a valid plugin file
	 *
	 * @param filename
	 * @returns {Promise<boolean|boolean|boolean>}
	 */
	static async isPluginFilename(filename:string) {
		const
			isDir = await PluginLoader.isPluginDir(filename),
			isZip = !isDir && _.toLower(Path.extname(filename)) === '.zip'
		
		return isZip || isDir
		
	}
	
	/**
	 * Directory that has the unpacked plugin
	 */
	private dirname:string
	
	/**
	 * package.json
	 */
	private pkg:any
	
	/**
	 * Is a directory
	 */
	private isDir:boolean
	
	/**
	 * Is a zip
	 */
	private isZip:boolean
	
	
	/**
	 * Plugin ref
	 */
	private _plugin:IPluginInternal
	
	/**
	 * Get the plugin ref
	 *
	 * @returns {IPluginInternal}
	 */
	get plugin() {
		return this._plugin
	}
	
	/**
	 * Create plugin facade wrapper for lifecycle events
	 *
	 * @param fnName
	 * @returns {()=>Promise<IPluginInternal>}
	 */
	private makeFacade(fnName:string) {
		return async () => {
			if (isFunction(getValue(() => this.plugin.entry[fnName]))) {
				try {
					await this.plugin.entry[fnName]()
				} catch (err) {
					log.error(`Failed to ${fnName} plugin ${this.plugin.name}`,err)
					throw err
				}
			}
			return this.plugin
		}
	}
	
	/**
	 * Call plugin load
	 */
	readonly load:IPluginLifecycle = this.makeFacade('load')
	
	/**
	 * Call plugin unload
	 */
	readonly unload:IPluginLifecycle = this.makeFacade('unload')
	
	/**
	 * Call plugin start
	 */
	readonly start:IPluginLifecycle = this.makeFacade('start')
	
	/**
	 * Call plugin stop
	 */
	readonly stop:IPluginLifecycle = this.makeFacade('stop')
	
	
	/**
	 * Construct plugin loader
	 *
	 * @param pluginConfig
	 */
	constructor(private pluginConfig:IPluginConfig) {
	
	}
	
	/**
	 * Get the plugin instance
	 *
	 * @returns {IPlugin}
	 */
	getPlugin():IPlugin {
		return this.plugin
	}
	
	/**
	 * Set the plugin ref
	 *
	 * @param plugin
	 */
	private setPlugin(plugin:IPluginInternal) {
		this._plugin = plugin
	}
	
	/**
	 * Initialize the loader
	 *
	 * @returns {Promise<void>}
	 */
	async init() {
		const
			{name,main,description,version,dirname,isZip,filename} = this.pluginConfig
		
		try {
			assert(this.pkg,`failed to read package config from dir ${this.dirname}`)
			const
				module = new PluginModuleLoader(this,dirname), //Module.prototype._compile(entrySrc,entry),
				entry = module.pluginRequire(main)
			
			this.setPlugin({
				filename,
				isZip,
				dirname: this.dirname,
				name,
				main,
				description,
				version,
				entry,
				module,
				load: this.load,
				unload: this.unload,
				start: this.start,
				stop: this.stop
			})
			
			
		} catch (err) {
			log.error(`Failed to init plugin: ${dirname}`,err)
			getNotificationCenter().notifyError(`Unable to init plugin (${dirname}): ${err.message}`)
		}
	}
	
	
	
	/**
	 * Handle a file watcher event
	 *
	 * @param event
	 * @param filename
	 */
	handleFileWatcherEvent = (event:FileWatcherEvent,filename:string) => {
		// IF EVENT WAS CONSUMED THEN RETURN TRUE
		return false
	}
	
}

export default PluginLoader

declare global {
	interface IPluginLoader extends PluginLoader {}
}