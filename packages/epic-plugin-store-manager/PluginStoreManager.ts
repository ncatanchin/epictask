import "epic-plugin"

import {Map,List} from 'immutable'
import {
	getUserDataFilename,
	pluginDefaultPath,
	SettingsPath,
	guard,
	getHot,
	acceptHot,
	setDataOnHotDispose, AppKey, addHotDisposeHandler
} from 'epic-global'
import * as Path from 'path'
import Glob = require('glob')
import PluginStore  from "./PluginStore"
import { isString, getValue } from "typeguard"
import mkdirp = require('mkdirp')

import { pluginsSelector,PluginState } from "epic-typedux"
import { getAppActions } from "epic-typedux/provider"

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
export class PluginStoreManager {
	
	constructor() {
	
	}
	
}

/**
 * Plugin manager namespace
 */
export namespace PluginStoreManager {
	
	const
		DefaultPath = pluginDefaultPath,
		directories = getHot(module,'directories',{} as any) as {[directory:string]:PluginStore},
		pluginConfigs = getHot(module,'plugins',{} as any) as {[name:string]:IPlugin}
	
	// HMR
	setDataOnHotDispose(module,() => ({
		directories,
		pluginConfigs
	}))
	
	
	let
		unsubscribers:Function[] = []
	
	addHotDisposeHandler(module,() => unsubscribers
		.forEach(unsubscribe => guard(() => unsubscribe())))
	
	log.debug(`Create if not exist: ${DefaultPath}`)
	mkdirp.sync(DefaultPath)
	
	
	export function getPluginStatus(name:string) {
		const
			pluginState = getValue(() => pluginsSelector(getStoreState()).get(name), new PluginState())
		
		return pluginState.processStatus.get(getProcessId())
	}
	
	/**
	 * Initialize the plugins and subscribe for directory changes
	 */
	export async function init() {
		log.debug(`init plugin manager`)
		
		
		// LOAD STORES
		unsubscribers.push(getStore().observe([...SettingsPath,'pluginStores'],loadStores))
		await loadStores()
	}
	
	
	/**
	 * Register a plugin - usually from store event
	 *
	 * @param plugin
	 * @returns {Promise<void>}
	 */
	export async function registerPlugin(plugin:IPlugin) {
		if (pluginConfigs[plugin.name]) {
			log.debug(`Plugin is already registered (${plugin.name}) - unloading first`)
			await unregisterPlugin(plugin)
		}
		
		pluginConfigs[plugin.name] = plugin
		
		//TODO: Add disabled check (settings)
		getAppActions().setPluginConfig(plugin)
		
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
			plugin = pluginConfigs[name]
		
		if (!plugin)
			return
		
		getAppActions().removePluginConfig(plugin)
		delete pluginConfigs[name]
	}
	
	
	/**
	 * On plugin found
	 *
	 * @param event
	 * @param plugin
	 */
	export function onPluginFound(event, plugin:IPlugin) {
		const
			name = getValue(() => plugin.name),
			exists = !!pluginConfigs[name]
		
		if (exists) {
			log.info(`Plugin update: ${plugin.name}`)
			registerPlugin(plugin)
		} else {
			log.info(`Plugin found: ${plugin.name}`)
			registerPlugin(plugin)
		}
		

	}
	
	export function onPluginUpdate(event, plugin:IPlugin) {
		
		log.info(`Plugin update: ${plugin.name}`)
		registerPlugin(plugin)
	}
	
	
	/**
	 * On plugin removed
	 *
	 * @param event
	 * @param plugin
	 */
	export function onPluginRemoved(event, plugin:IPlugin) {
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
			dirnames = getSettings().pluginStores
		
		log.debug(`Loading directories`,dirnames)
		
		// CLEAN FIRST
		Object.entries(directories)
			.filter(([dirname,dir]) => !dirnames.includes(dirname))
			.forEach(([dirname,dir]) => {
				
				Object.values(pluginConfigs)
					.filter(pluginConfig => pluginConfig.storeDirname === dirname)
					.forEach(unregisterPlugin)
				
				dir.close()
				
				delete directories[dirname]
			})
		
		
		const
			existingDirnames = Object.keys(directories),
			newDirnames = dirnames.filter(dirname => !existingDirnames.includes(dirname))
		
		await Promise.all(
			newDirnames.map(async (dirname) => {
				try {
					const
						dir = directories[dirname] = new PluginStore(dirname)
					
					unsubscribers.push(
						EventHub.on(EventHub.PluginFound,onPluginFound),
						EventHub.on(EventHub.PluginUpdate,onPluginUpdate),
						EventHub.on(EventHub.PluginRemoved,onPluginRemoved)
					)
					
					
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

