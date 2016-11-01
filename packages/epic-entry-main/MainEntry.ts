
import { nilFilter } from "epic-global/ListUtil"

import Cleaner from './Cleaner'



// NOW LOAD COMMON ENTRY
import 'epic-entry-shared/AppEntry'

// LOAD DEPS
import { showSplashWindow } from "epic-entry-main/SplashWindow"
import { Events,isString } from "epic-global"
import { app, BrowserWindow } from 'electron'
import checkSingleInstance from "./CheckSingleInstance"
import './MainAppSwitches'

const
	log = getLogger(__filename)


function loadMainApp() {
		
	
	// ADD EVENTS TO GLOBAL
	assignGlobal({
		Constants: {
			Events
		}
	})
	
	
	// HMR
	log.debug(`Hot reload mode enabled: ${Env.isHot}`)
	
	
	/**
	 * Get the service manager
	 *
	 * @returns {ServiceManager}
	 */
	function getServiceManager() {
		return require('epic-services/internal/ServiceManager').getServiceManager()
	}
	
	/**
	 * Stop everything
	 *
	 * @returns {Promise<T>|Promise<T|U>}
	 */
	async function stop() {
		await getServiceManager().stop()
	}

	/**
	 * Callback from open if already running
	 */
	function onFocus() {
		
		// APP FOCUS EVENT - LIKELY SOME TRYING TO START SECOND INSTANCE
		const
			allWindows = BrowserWindow.getAllWindows(),
			win = allWindows && allWindows[ 0 ]
		
		if (win) {
			win && win.isMinimized() && win.restore()
			win.focus()
		}
		
		
	}
	
	
	/**
	 * On open event handler
	 *
	 * @param event
	 */
	function onOpen(event) {
		log.info(`Received on open event`, event)
		event.preventDefault()
	}
	
	
	/**
	 * Load the command manager for global shortcuts and native menu on mac
	 *
	 * @returns {any|CommandManager}
	 */
	function loadCommandManager() {
		const
			commandManagerMod = require('epic-command-manager'),
			commandManager = commandManagerMod.getCommandManager(),
			
			electronMenuProvider =
				require('epic-command-manager')
					.ElectronMainManagerProvider
		
		
		commandManager.setMenuManagerProvider(electronMenuProvider)
		return commandManager
	}
	
	/**
	 * Create boot dependencies func
	 *
	 * @param steps
	 * @returns {()=>Promise<void>}
	 */
	function makeBootDependencies(...steps:any[]) {
		
		steps = nilFilter(steps)
		
		return async () => {
			for (let step of steps) {
				
				const
					parts = Array.isArray(step) ? step : [step],
					results = []
				
				for (let part of parts) {
					if (isString(part)) {
						log.debug(`Boot: ${part}`)
						continue
					}
					
					let
						result = part()
					
					if (result)
						results.push(Promise.resolve(result))
				}
				
				await Promise.all(results)
				
			}
		}
	}
	
	
	/**
	 * Boot dependencies func
	 *
	 * @type {()=>Promise<any>}
	 */
	const boot = makeBootDependencies(
		
		// DEV CONFIG
		Env.isDev && (() => require('./MainDevConfig')),
		
		// SPLASH WINDOW
		() => showSplashWindow(),
		
		// NAV MANAGER
		() => require('./NavManager').start(),
		
		// APP STORE
		() => require('epic-typedux/store/AppStoreBuilder').storeBuilder(require('./AppStoreServerEnhancer').default),
			
		// COMMAND MANAGER + AppStoreServer
		[
			() => loadCommandManager(),
			() => require("./AppStoreServer").start()
		],
		
		// LOAD THE REST
		[
			() => require('epic-process-manager/WindowManagerLoader').start(),
			() => getServiceManager().start()
		],
		[
			"set app ready",
			() => require('epic-typedux/provider').getAppActions().setReady(true)
		]
	)
	
	
	/**
	 * App started
	 */
	function onStart() {
		// ATTACH SERVICE MANAGER STOP TO WILL-QUIT
		app.on('will-quit', stop)
		app.on('open-file', onOpen)
		app.on('open-url', onOpen)
		
		Cleaner.registerCleaner()
		
		return boot()
	}
	
	if (checkSingleInstance(app, onFocus)) {
		log.debug(`Is single instance`)
		
		if (app.isReady())
			onStart()
		else
			app.on('ready', onStart)
	}
	
	
	if (module.hot)
		module.hot.accept(() => log.info(`HMR reload`,__filename))
	
	
}


/**
 * Clean if --clean is passed
 */

if (Cleaner.isCleanRequested()) {
	Cleaner.clean()
}

loadMainApp()

export {
	
}
	