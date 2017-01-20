import { Map, Record, List } from "immutable"
import shx = require('shelljs')
import decompress = require('decompress')

import { FileWatcherEvent, fileExists, cachePath, isDirectory, cloneObjectShallow } from "epic-global"
import { IPlugin } from "./Plugin"

import * as Path from 'path'
import * as Fs from 'async-file'
import { isDefined, getValue, isFunction } from "typeguard"
import { unpackPluginZip } from "./PluginUtils"

const Module = require('module')

/**
 * Created by jglanz on 1/19/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

// Cache the plugin env
nodeRequire.cache['epic-plugin-env'] = require('epic-plugin-env')

/**
 * Internal plugin rep
 */
export interface IPluginInternal extends IPlugin {
	mod:any
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
	
	private dirname:string
	
	private pkg:any
	
	private isDir:boolean
	
	private isZip:boolean
	
	private plugin:IPluginInternal
	
	constructor(private dirOrZipname:string) {
		assert(fileExists(dirOrZipname),`Directory or zip with filename does not exist: ${dirOrZipname}`)
		
		
	}
	
	/**
	 * Get the plugin instance
	 *
	 * @returns {IPlugin}
	 */
	getPlugin():IPlugin {
		return this.plugin
	}
	
	// private pluginRequire = (modName:string) => {
	// 	if (modName === 'epic-plugin-env')
	// 		return
	//
	// 	if (nodeRequire.cache[modName])
	// 		return nodeRequire.cache[modName]
	//
	// 	if (this.internalRequireCache[modName])
	// 		return this.internalRequireCache[modName]
	//
	//
	// 	if (fileExists(Path.resolve()))
	//
	// 	nodeRequire(modName)
	// }
	
	/**
	 * Initialize the loader
	 *
	 * @returns {Promise<void>}
	 */
	async init() {
		try {
			this.isDir = await PluginLoader.isPluginDir(this.dirOrZipname)
			this.isZip = !this.isDir && _.toLower(Path.extname(this.dirOrZipname)) === '.zip'
			this.dirname = this.isZip ? (await unpackPluginZip(this.dirOrZipname)) : this.dirOrZipname
			this.pkg = await PluginLoader.getPluginDescriptor(this.dirname)
			
			assert(this.pkg,`failed to read package config from dir ${this.dirname}`)
			const
				{name,description,version,main} = this.pkg
			
			let
				mainBasename = Path.resolve(this.dirname,main),
				mainBasenameExtended = mainBasename + '.js'
			
			assert(fileExists(mainBasename) || fileExists(mainBasenameExtended),`Main file for plugin does not exist (${main}): ${mainBasename} / ${mainBasenameExtended}`)
			
			const
				entry = fileExists(mainBasename) ? mainBasename : mainBasenameExtended,
				entrySrc = await Fs.readFile(entry,'utf8'),
				mod = nodeRequire(entry), //Module.prototype._compile(entrySrc,entry),
				{load,unload,start,stop} = mod
			
			this.plugin = {
				name,
				description,
				version,
				entry,
				mod,
				load: this.load,
				unload: this.unload,
				start: this.start,
				stop: this.stop
			}
			
			
		} catch (err) {
			log.error(`Failed to init plugin: ${this.dirOrZipname}`,err)
			getNotificationCenter().notifyError(`Unable to init plugin (${this.dirOrZipname}): ${err.message}`)
		}
	}
	
	
	
	/**
	 * Load the plugin
	 *
	 * @returns {Promise<IPlugin>}
	 */
	load = async ():Promise<IPlugin> => {
		if (isFunction(getValue(() => this.plugin.mod.load))) {
			try {
				await this.plugin.mod.load()
			} catch (err) {
				log.error(`Failed to stop plugin ${this.plugin.name}`,err)
			}
		}
		return this.plugin
	}
	
	unload = async ():Promise<IPlugin> => {
		if (isFunction(getValue(() => this.plugin.mod.unload))) {
			try {
				await this.plugin.mod.unload()
			} catch (err) {
				log.error(`Failed to stop plugin ${this.plugin.name}`,err)
			}
		}
		return this.plugin
	}
	
	start = async ():Promise<IPlugin> => {
		if (isFunction(getValue(() => this.plugin.mod.start))) {
			try {
				await this.plugin.mod.start()
			} catch (err) {
				log.error(`Failed to stop plugin ${this.plugin.name}`,err)
			}
		}
		return this.plugin
	}
	
	stop = async ():Promise<IPlugin> => {
		if (isFunction(getValue(() => this.plugin.mod.stop))) {
			try {
				await this.plugin.mod.stop()
			} catch (err) {
				log.error(`Failed to stop plugin ${this.plugin.name}`,err)
			}
		}
		return this.plugin
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