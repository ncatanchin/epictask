import "epic-plugin"

import {Map,List} from 'immutable'
import {
	guard,
	getHot,
	acceptHot,
	setDataOnHotDispose, AppKey, addHotDisposeHandler
} from 'epic-global'
import Glob = require('glob')
import { isString, getValue } from "typeguard"

import { pluginsSelector,PluginState } from "epic-typedux"
import { isPluginEnabled } from "epic-plugin"

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
	
}

/**
 * Plugin manager namespace
 */
export namespace PluginManager {
	
	
	const
		unsubscribers:Function[] = [],
		plugins = getHot(module,'plugins',{} as any) as {[name:string]:IPlugin}
	
	// HMR
	setDataOnHotDispose(module,() => ({
		plugins
	}))
		
	
	addHotDisposeHandler(module,() => unsubscribers
		.forEach(unsubscribe => guard(() => unsubscribe())))
	
	
	
	export function getPluginStatus(name:string) {
		const
			pluginState = getValue(
				() => pluginsSelector(getStoreState()).get(name),
				new PluginState()
			)
		
		return pluginState.processStatus.get(getProcessId())
	}
	
	
	
	
	/**
	 * PluginStates changed in store
	 *
	 * @param pluginStates
	 * @param oldPluginStates
	 * @returns {Promise<void>}
	 */
	export async function onPluginStatesChanged(pluginStates:Map<string,PluginState>,oldPluginStates:Map<string,PluginState> = Map<string,PluginState>()) {
		const
			deletedPlugins = [],
			newPlugins = [],
			updatedPlugins = []
		
		// FIND NEW & UPDATED
		pluginStates.keySeq().forEach(name => {
			const
				pluginState = pluginStates.get(name)
			
			let
				oldPluginState:PluginState = null
			
			if (!oldPluginStates || !oldPluginStates.has(name)) {
				newPlugins.push([name,pluginState])
			} else if (getValue(() => oldPluginState.config.updatedAt < pluginState.config.updatedAt, false)) {
			//} else if ((oldPluginState = oldPluginStates.get(name)) !== pluginState || oldPluginState.timestamp <
				// pluginState.timestamp) {
				updatedPlugins.push([name,pluginState])
			}
		})
		
		// FIND DELETED
		if (oldPluginStates) {
			oldPluginStates.keySeq().forEach(oldName => {
				if (!pluginStates.has(oldName)) {
					deletedPlugins.push([name,oldPluginStates.get(oldName)])
				}
			})
		}
		
		
		// REMOVE DELETED
		deletedPlugins.forEach(([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
				
			
			log.debug(`Plugin ${name}: DELETED`)
		})
		
		// UPDATED
		updatedPlugins.forEach(([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
			
			log.debug(`Plugin ${name}: UPDATED`)
		})
		
		// NEW
		newPlugins.forEach(([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
			
			log.debug(`Plugin ${name}: NEW`)
		})
	}
	
	/**
	 * Initialize the plugins and subscribe for directory changes
	 */
	export async function init() {
		log.debug(`init plugin manager`)
		
		
		// LOAD STORES ON MAIN
		onPluginStatesChanged(pluginsSelector(getStoreState()))
		unsubscribers.push(getStore().observe([AppKey,'plugins'],onPluginStatesChanged))
		
		
	}
	
	/**
	 * Start plugin
	 *
	 * @param name
	 * @returns {Promise<void>}
	 */
	export async function startPlugin(name:string) {
		const
			plugin = plugins[name],
			pluginStatus = getPluginStatus(name)
		
		if (Env.isMain || !isPluginEnabled(plugin) || pluginStatus === PluginStatus.Running) {
			return
		}
		
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
	 * Stop plugin
	 *
	 * @param name
	 * @returns {Promise<void>}
	 */
	export async function stopPlugin(name:string) {
		const
			plugin = plugins[name],
			pluginStatus = getPluginStatus(name)
		
		if (pluginStatus !== PluginStatus.Running && (Env.isMain || !isPluginEnabled(plugin))) {
			return
		}
		
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
	 * Register a plugin - usually from store event
	 *
	 * @param plugin
	 * @returns {Promise<void>}
	 */
	export async function registerPlugin(plugin:IPlugin) {
		if (plugins[plugin.name]) {
			log.debug(`Plugin is already registered (${plugin.name}) - unloading first`)
			await unregisterPlugin(plugin)
		}
		
		plugins[plugin.name] = plugin
		
		//TODO: Add disabled check (settings)
		startPlugin(plugin.name)
		
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
		
		stopPlugin(name)
		
	}
	
}

acceptHot(module,log)
