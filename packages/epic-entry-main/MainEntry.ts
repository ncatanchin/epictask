
import Cleaner from './Cleaner'



// NOW LOAD COMMON ENTRY
import 'epic-entry-shared/AppEntry'
import "./MainShutdownHandler"

// LOAD DEPS
import { showSplashWindow, hideSplashWindow } from "epic-entry-main/SplashWindow"
import { app, BrowserWindow } from 'electron'
import checkSingleInstance from "./CheckSingleInstance"
import makeBootLoader from "epic-entry-shared/BootLoader"
import './MainAppSwitches'


const
	log = getLogger(__filename)


function loadMainApp() {
		
	
	
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
			commandManager = commandManagerMod.getCommandManager()
		//
		// 	electronMenuProvider =
		// 		require('epic-command-manager')
		// 			.ElectronMainManagerProvider
		//
		//
		commandManager.setMenuManagerProvider(
			require('epic-command-manager/CommandElectronMenuManager')
				.CommandElectronMenuManager
		)
		return commandManager
	}
	
	
	
	
	/**
	 * Boot dependencies func
	 *
	 * @type {()=>Promise<any>}
	 */
	const boot = makeBootLoader(
		
		// DEV CONFIG
		Env.isDev && (() => require('./MainDevConfig')),
		
		// SPLASH WINDOW
		() => Env.skipSplash ? Promise.resolve() : showSplashWindow(),
		
		// NAV MANAGER
		() => require('./NavManager').start(),
		
		// APP STORE
		() => require('epic-typedux/store/AppStoreBuilder').storeBuilder(require('./AppStoreServerEnhancer').default),
			
		// COMMAND MANAGER + AppStoreServer
		[
			() => loadCommandManager(),
			() => require("./AppStoreServer").start()
		],
		//
		// LOAD THE REST
		[
			() => require('epic-process-manager/WindowManagerLoader').start(),
			() => getServiceManager().start()
		],
		
		// MARK ALL READY
		[
			"set app ready",
			() => require('epic-typedux/provider').getAppActions().setReady(true)
		],
		
		// HIDE SPLASH
		() => Env.skipSplash ? Promise.resolve() : hideSplashWindow(),
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
	