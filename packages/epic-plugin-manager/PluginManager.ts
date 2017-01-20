import { Map, Record, List } from "immutable"
import {
	getUserDataFilename, PluginDefaultPath, SettingsPath, guard, getHot, acceptHot,
	setDataOnHotDispose
} from 'epic-global'
import * as Fs from 'fs'
import * as Path from 'path'
import Glob = require('glob')
import PluginDirectory from "./PluginDirectory"
import { PluginDirectoryEvent } from "epic-plugin-manager/PluginDirectory"
import { IPlugin } from "epic-plugin-manager/Plugin"
import { isString } from "typeguard"

const
	mkdirp = require('mkdirp')

/**
 * Created by jglanz on 1/15/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * PluginManager
 *
 * @class PluginManager
 * @constructor
 **/
export class PluginManager {
	
	constructor() {
		
	}
	
}

/**
 * Plugin manager namespace
 */
export namespace PluginManager {
	
	const
		DefaultPath = PluginDefaultPath,
		directories = getHot(module,'directories',{} as any) as {[directory:string]:PluginDirectory},
		plugins = getHot(module,'plugins',{} as any) as {[name:string]:IPlugin}
	
	// HMR
	setDataOnHotDispose(module,() => ({
		directories,
		plugins
	}))
		
	
	let
		unsubscribe:Function
	
	log.debug(`Create if not exist: ${DefaultPath}`)
	mkdirp.sync(DefaultPath)
	
	/**
	 * Add a plugin directory (for dev really)
	 *
	 * @param dirs
	 */
	export function addDirectory(...dirs:string[]) {
		updateSettings({
			pluginDirectories: _.uniq([
				PluginDefaultPath,
				...(getSettings().pluginDirectories || []),
				...dirs.map(dir => Path.resolve(dir))
			])
		})
	}
	
	export function removeDirectory(...dirs:string[]) {
		updateSettings({
			pluginDirectories:
				_.uniq([
					PluginDefaultPath,
					...(getSettings().pluginDirectories || [])
				])
				.filter(dir => !dirs.map(dir => Path.resolve(dir)).includes(dir))
		})
	}
	
	
	/**
	 * Initialize the plugins and subscribe for directory changes
	 */
	export async function init() {
		log.debug(`init plugin manager`)
		unsubscribe = getStore().observe([...SettingsPath,'pluginDirectories'],loadDirectories)
		await loadDirectories()
	}
	
	
	export async function registerPlugin(plugin:IPlugin) {
		if (plugins[plugin.name])
			await unregisterPlugin(plugin)
		
		plugins[plugin.name] = plugin
		
		//TODO: Add disabled check (settings)
		
		try {
			log.info(`Loading ${plugin.name}`)
			await plugin.load()
			
			log.info(`Starting ${plugin.name}`)
			await plugin.start()
		} catch (err) {
			log.error(`Failed to load plugin: ${name}`,err)
		}
	}
	
	export async function unregisterPlugin(pluginOrName:IPlugin|string) {
		const
			name = isString(pluginOrName) ? pluginOrName : pluginOrName.name,
			plugin = plugins[name]
		
		if (!plugin)
			return
		
		try {
			await plugin.stop()
		} catch (err) {
			log.error(`Failed to stop plugin: ${name}`,err)
		}
		
		try {
			await plugin.unload()
		} catch (err) {
			log.error(`Failed to unload plugin: ${name}`,err)
		}
		
		delete plugins[name]
	}
	
	export function onPluginFound(event:PluginDirectoryEvent,plugin:IPlugin) {
		log.info(`Plugin found: ${plugin.name}`)
		registerPlugin(plugin)
		
	}
	
	export function onPluginRemoved(event:PluginDirectoryEvent,plugin:IPlugin) {
		log.info(`Plugin removed: ${plugin.name}`)
		unregisterPlugin(plugin)
	}
	
	/**
	 * Close directory
	 *
	 * @param dirname
	 */
	export function closeDirectory(dirname:string) {
		guard(() => directories[dirname].close())
		delete directories[dirname]
	}
	
	async function loadDirectories() {
		const
			dirnames = getSettings().pluginDirectories
		
		log.debug(`Loading directories`,dirnames)
		
		// CLEAN FIRST
		Object.entries(directories)
			.forEach(([dirname,dir]) => {
				if (!dirnames.includes(dirname)) {
					dir.close()
					delete directories[dirname]
				}
			})
		
		
		const
			existingDirnames = Object.keys(directories),
			newDirnames = dirnames.filter(dirname => !existingDirnames.includes(dirname))
		
		await Promise.all(
			newDirnames.map(async (dirname) => {
				try {
					const
						dir = directories[dirname] = new PluginDirectory(dirname)
					
					dir.on(PluginDirectoryEvent.Found,onPluginFound)
					dir.on(PluginDirectoryEvent.Removed,onPluginRemoved)
					
					await dir.open()
				} catch (err) {
					log.error(`Failed to open directory: ${dirname}`)
					closeDirectory(dirname)
				}
			})
		)
		
	}
}

acceptHot(module,log)

export default PluginManager