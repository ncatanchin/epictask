import { acceptHot } from "epic-global/HotUtils"
import Electron from 'epic-electron'
import "./CheckSingleInstance"
import Cleaner from './Cleaner'

// NOW LOAD COMMON ENTRY
import 'epic-entry-shared/AppEntry'
import "./MainShutdownHandler"

// LOAD DEPS
import { showSplashWindow, hideSplashWindow } from "./SplashWindow"
import makeBootLoader from "./BootLoader"
import { handleError } from "./BootErrorHandler"



const
	log = getLogger(__filename),
	{ app } = Electron


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
		
		// DEV CONzFIG
		Env.isDev && (() => require('./MainDevConfig')),
		
		// SPLASH WINDOW
		() => Env.skipSplash ? Promise.resolve() : showSplashWindow(),
		
		// DEV CONFIG
		(Env.isMac || Env.isDev) && (() => require('./MainMenu').execute()),
		
		// NAV MANAGER
		() => require('./NavManager').start(),
		
		// APP STORE
		() => require('epic-typedux/store/AppStoreBuilder').storeBuilder(require('./AppStoreServerEnhancer').default),
			
		// COMMAND MANAGER + AppStoreServer
		[
			() => loadCommandManager(),
			() => require("./AppStoreServer").start()
		],
		
		// LOAD DATABASE
		() => require('./DatabaseServerLoader').start(),
		
		// LOAD THE REST
		[
			() => require('./WindowManagerLoader').start(),
			() => getServiceManager().start()
		],
		
		// MARK ALL READY
		[
			"set app ready",
			() => require('./TrayManager').default.start(),
			() => require('epic-typedux/provider').getAppActions().setReady(true)
		],
		
		// HIDE SPLASH
		[
			() => require('epic-plugin-store-manager').PluginStoreManager.init(),
			() => Env.skipSplash ? Promise.resolve() : hideSplashWindow()
		]
	)
	
	
	/**
	 * App started
	 */
	
	// ATTACH SERVICE MANAGER STOP TO WILL-QUIT
	app.on('will-quit', stop)
	app.on('open-file', onOpen)
	app.on('open-url', onOpen)
	
	Cleaner.registerCleaner()
	
	boot().catch(err => {
		log.error(`Failed to boot`,err)
		handleError(
			"Unable to start",
			`Epictask could not start, do you want to delete the local app config and retry? (nothing on github will be deleted).  Reason: ${err.message}`,err
		)
	})

	
	
	
	
	
}

/**
 * Start the entire app
 */
function start() {
	if (Cleaner.isCleanRequested()) {
		Cleaner.clean()
	}
	require('./AppUpdateManager')
	loadMainApp()
}


// FIRST - MAKE SURE WE ARE THE SINGLE INSTANCE

if (app.isReady())
	start()
else
	app.on('ready', start)



acceptHot(module)



export {
	
}
	