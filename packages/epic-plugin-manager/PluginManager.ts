import {
	getUserDataFilename,
	pluginDefaultPath,
	SettingsPath,
	guard,
	getHot,
	acceptHot,
	setDataOnHotDispose
} from 'epic-global'
import * as Path from 'path'
import Glob = require('glob')
import PluginStore,{ PluginStoreEvent }  from "./PluginStore"
import { isString } from "typeguard"
import mkdirp = require('mkdirp')

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
		DefaultPath = pluginDefaultPath,
		directories = getHot(module,'directories',{} as any) as {[directory:string]:PluginStore},
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
	export function addStore(...dirs:string[]) {
		updateSettings({
			pluginDirectories: _.uniq([
				pluginDefaultPath,
				...(getSettings().pluginDirectories || []),
				...dirs.map(dir => Path.resolve(dir))
			])
		})
	}
	
	/**
	 * Remove directory
	 *
	 * @param dirs
	 */
	export function removeStore(...dirs:string[]) {
		updateSettings({
			pluginDirectories:
				_.uniq([
					pluginDefaultPath,
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
		unsubscribe = getStore().observe([...SettingsPath,'pluginDirectories'],loadStores)
		await loadStores()
	}
	
	/**
	 * Register a plugin - usually from store event
	 *
	 * @param plugin
	 * @returns {Promise<void>}
	 */
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
	
	/**
	 * Unregister a plugin
	 *
	 * @param pluginOrName
	 * @returns {Promise<void>}
	 */
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
	
	/**
	 * On plugin found
	 *
	 * @param event
	 * @param plugin
	 */
	export function onPluginFound(event:PluginStoreEvent, plugin:IPlugin) {
		log.info(`Plugin found: ${plugin.name}`)
		registerPlugin(plugin)
		
	}
	
	/**
	 * On plugin removed
	 *
	 * @param event
	 * @param plugin
	 */
	export function onPluginRemoved(event:PluginStoreEvent, plugin:IPlugin) {
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
	
	/**
	 * Load all the stores
	 * 
	 * @returns {Promise<void>}
	 */
	async function loadStores() {
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
						dir = directories[dirname] = new PluginStore(dirname)
					
					dir.on(PluginStoreEvent.Found,onPluginFound)
					dir.on(PluginStoreEvent.Removed,onPluginRemoved)
					
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