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
import { PluginLoader } from "epic-plugin-manager/PluginLoader"

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
		pluginLoaders = getHot(module,'pluginLoaders',{} as any) as {[name:string]:PluginLoader}
	
	// HMR
	setDataOnHotDispose(module,() => ({
		pluginLoaders
	}))
		
	
	addHotDisposeHandler(module,() => unsubscribers
		.forEach(unsubscribe => guard(() => unsubscribe())))
	
	
	
	export function getPluginStatus(name:string) {
		const
			pluginState = getValue(
				() => pluginsSelector(getStoreState()).get(name),
				new PluginState()
			)
		
		return getValue(() => pluginState.processStatus.get(getProcessId()))
	}
	
	
	
	
	/**
	 * PluginStates changed in store
	 *
	 * @param pluginStates
	 * @param oldPluginStates
	 * @returns {Promise<void>}
	 */
	export async function onPluginStatesChanged(pluginStates:Map<string,PluginState>,oldPluginStates:Map<string,PluginState> = Map<string,PluginState>()) {
		log.info(`Processing pluginLoaders: ${pluginStates.keySeq().join(', ')}`)
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
		await Promise.all(deletedPlugins.map(async ([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
				
			
			log.debug(`Plugin ${name}: DELETED`)
			await stopPlugin(name,config)
		}))
		
		// UPDATED
		await Promise.all(updatedPlugins.map(async ([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
			
			log.debug(`Plugin ${name}: UPDATED`)
			await stopPlugin(name,config)
			await startPlugin(name,config)
		}))
		
		// NEW
		await Promise.all(newPlugins.map(async ([name,pluginState]) => {
			const
				{config,timestamp} = pluginState
			
			log.debug(`Plugin ${name}: NEW`)
			await startPlugin(name,config)
		}))
	}
	
	/**
	 * Initialize the pluginLoaders and subscribe for directory changes
	 */
	export async function init() {
		log.debug(`init plugin manager`)
		
		
		// LOAD STORES ON MAIN
		unsubscribers.push(getStore().observe([AppKey,'plugins'],onPluginStatesChanged))
		
		const
			appState = getStore().getState().get(AppKey) as IAppState
		
		log.info(`AppState`,appState)
		onPluginStatesChanged(appState.plugins)
		
	}
	
	/**
	 * Start plugin
	 *
	 * @param name
	 * @returns {Promise<void>}
	 * @param config
	 */
	export async function startPlugin(name:string,config:IPluginConfig) {
		const
			pluginLoader = pluginLoaders[name] = new PluginLoader(config)
		
		await pluginLoader.init()
		
		const
			plugin = pluginLoader.plugin,
			pluginStatus = getPluginStatus(name)
		
		if (Env.isMain || !isPluginEnabled(plugin) || pluginStatus === PluginStatus.Running) {
			log.info(`Not starting plugin/isMain=${Env.isMain}/isPluginEnabled=${isPluginEnabled(plugin)}/running=${pluginStatus === PluginStatus.Running}/status=${pluginStatus}`)
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
	 * @param config
	 */
	export async function stopPlugin(name:string,config:IPluginConfig) {
		const
			pluginLoader = pluginLoaders[name],
			plugin = pluginLoader && pluginLoader.plugin,
			pluginStatus = getPluginStatus(name)
		
		
		
		try {
			if (pluginStatus !== PluginStatus.Running && (Env.isMain || !isPluginEnabled(plugin))) {
				return
			}
			
			await plugin.stop()
		} catch (err) {
			log.error(`Failed to stop plugin: ${name}`,err)
		}
		
		try {
			await plugin.unload()
		} catch (err) {
			log.error(`Failed to unload plugin: ${name}`,err)
		}
		
		delete pluginLoaders[name]
		
	}
	//
	// /**
	//  * Register a plugin - usually from store event
	//  *
	//  * @param plugin
	//  * @returns {Promise<void>}
	//  */
	// export async function registerPlugin(plugin:IPlugin) {
	// 	if (pluginLoaders[plugin.name]) {
	// 		log.debug(`Plugin is already registered (${plugin.name}) - unloading first`)
	// 		await unregisterPlugin(plugin)
	// 	}
	//
	// 	pluginLoaders[plugin.name] = plugin
	//
	// 	//TODO: Add disabled check (settings)
	// 	startPlugin(plugin.name)
	//
	// }
	
	// /**
	//  * Unregister a plugin
	//  *
	//  * @param pluginOrName
	//  * @returns {Promise<void>}
	//  */
	// export async function unregisterPlugin(pluginOrName:IPlugin|string) {
	// 	const
	// 		name = isString(pluginOrName) ? pluginOrName : pluginOrName.name,
	// 		plugin = pluginLoaders[name]
	//
	// 	if (!plugin)
	// 		return
	//
	// 	stopPlugin(name)
	//
	// }
	//
	if (getValue(() => (module.hot.data as any).pluginLoaders)) {
		init()
	}
	
}

if (DEBUG) {
	assignGlobal({
		getPluginManager() {
			return PluginManager
		}
	})
}

acceptHot(module,log)
