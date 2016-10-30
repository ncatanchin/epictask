

import { addHotDisposeHandler } from "epic-global"
const
	{Cleaner} = require('./Cleaner')



// NOW LOAD COMMON ENTRY
import 'epic-entry-shared/AppEntry'


function loadMainApp() {
	
	let
		
		//Ref TO STORE SERVER STOP FUNC
		stopAppStoreServer:Function
	
	
	
	const
		{ Events } = require("epic-global/Constants"),
		
		{ app, BrowserWindow } = require('electron'),
		{ checkSingleInstance } = require("./CheckSingleInstance"),
		
		log = getLogger(__filename),
		hotReloadEnabled = Env.isHot
	
	// ADD EVENTS TO GLOBAL
	_.assignGlobal({ Constants: { Events } })
	
	
	// Reference for dev monitor window (redux, etc)
	log.debug(`Hot reload mode enabled: ${hotReloadEnabled}`)
	
	require('./MainAppSwitches')
	
	/**
	 * Get the service manager
	 *
	 * @returns {ServiceManager}
	 */
	function getServiceManager() {
		return require('epic-services/internal/ServiceManager').getServiceManager()
	}
	
	function getProcessManager() {
		return require('epic-process-manager/ProcessManagement').getProcessManager()
	}
	
	
	/**
	 * Start the app store server
	 */
	async function startAppStoreServer() {
		log.debug(`Starting AppStoreServer`)
		stopAppStoreServer = await require('./AppStoreServer').start()
		
		// HMR - SHUT IT DOWN
		addHotDisposeHandler(module, () => {
			stopAppStoreServer()
		})
		
		
		log.debug(`App store server is up`)
		
		
		// Check if the main process is completely loaded - if not then wait
		await require('./StartBackgroundWorkers').childServicesBoot()
	}
	
	/**
	 * Start all the services
	 *
	 * @returns {any}
	 */
	async function start():Promise<any> {
		await getServiceManager().start()
	}
	
	/**
	 * Stop everything
	 *
	 * @returns {Promise<T>|Promise<T|U>}
	 */
	async function stop() {
		await getServiceManager().stop()
	}

	// ATTACH SERVICE MANAGER STOP TO WILL-QUIT
	app.on('will-quit', stop)
	
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
	 * Start all child processes
	 *
	 * JobServer
	 * DatabaseServer
	 */
	async function startBackgroundWorkers() {
		await require('./StartBackgroundWorkers').startBackgroundProcesses()
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
	 * Boot the app
	 */
	async function boot() {
		
		if (Env.isDev)
			require('./MainDevConfig')
		
		require('./NavManager')
		
		log.debug("Boot start")
		loadCommandManager()
		
		global[ Events.MainBooted ] = false
		
		log.debug("Load Main Window")
		
		const
			appWindow = require('./AppWindow')
		
		// Load the main window & start the loader animation
		await appWindow.start(async() => {
			log.debug('Starting Services')
			
			await startBackgroundWorkers()
			await start()
			
			log.debug('Services started')
		})
		
		// Notifying the main window that we are ready
		global[ Events.MainBooted ] = true
		
		setImmediate(() => {
			appWindow.ready()
		})
		
		
	}
	
	
	/**
	 * App started
	 */
	function onStart() {
		app.on('open-file', onOpen)
		app.on('open-url', onOpen)
		
		Cleaner.registerCleaner()
		
		//app.setName('EpicTask')
		return boot()
	}
	
	if (checkSingleInstance(app, onFocus)) {
		log.debug(`Is single instance`)
		// app.on('will-quit',onWillQuit)
		if (app.isReady())
			onStart()
		else
			app.on('ready', onStart)
	}
	
	
	if (module.hot)
		module.hot.accept(() => log.info(`HMR reload`,__filename))
	
	
}

/**
 * Enable HMR
 */

/**
 * Clean if --clean is passed
 */


if (Cleaner.isCleanRequested()) {
		Cleaner.clean()
}

loadMainApp()

export {
	
}
	