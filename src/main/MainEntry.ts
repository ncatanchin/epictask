require('shared/NodeEntryInit')

import {RemoteDebuggingPort,Events} from 'shared/Constants'
import MainConfigurator from './MainConfigurator'

const {app} = require('electron')



// LOGGING

const log = getLogger(__filename)

// ADD EVENTS TO GLOBAL
_.assignGlobal({Constants:{Events}})


// Main window ref
let persistedQuitState = false
let mainWindow:any

// HMR Configuration for development
const hotReloadEnabled = Env.isHot

// Reference for dev monitor window (redux, etc)
let devWindow = null

log.info(`Hot reload mode enabled: ${hotReloadEnabled}`)

/**
 * In debug mode enable remote debugging
 */
if (Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}



/**
 * Boot the app
 */
async function boot() {

	if (Env.isDev)
		require('./MainDevConfig')

	log.info("Boot start")
	global.MainBooted = false

	
	log.info("Boot load window")
	mainWindow = require('./MainWindow')
	
	// DEV Redux - no real need anymore
	// if (Env.isDev && !devWindow) {
	// 	devWindow = require('./MainDevToolWindow').window as Electron.BrowserWindow
	// }


	log.info("Boot start")
	await mainWindow.start(async () => {
		log.debug('Main window loaded and waiting for backend')
		
		await MainConfigurator.start()
		
		log.info('Main Configurator Completed')
	})

	log.info("Boot complete, call ready")
	
	// Notifying the main window that we are ready
	global.MainBooted = true
	
	const
		{AppActionFactory} = require('shared/actions/AppActionFactory'),
		appActions = new AppActionFactory()
	
	appActions.setReady(true)
	
	setTimeout(() => mainWindow.ready(),300)
}

/**
 * All windows closed
 */
function onAllClosed() {
	log.debug('All windows closed')

	if (process.platform !== 'darwin')
		app.quit()
}

/**
 * App started
 */
function onStart() {
	app.setName('EpicTask')
	return boot()
}

/**
 * Make sure we are the only running instance
 */
const shouldQuit = app.makeSingleInstance(() => {
	
	// Someone tried to run a second instance, we should focus our window.
	const win = mainWindow && mainWindow.getBrowserWindow()
	
	if (win) {
		win && win.isMinimized() && win.restore()
		win.focus()
	}
	
})

/**
 * Bind events
 */
if (shouldQuit) {
	log.warn('*** Another instance is running, we will exit')
	app.quit()
} else {
	if (!Env.isHot)
		app.on('window-all-closed', onAllClosed)

	// app.on('will-quit',onWillQuit)
	app.on('ready', onStart)
}


/**
 * Enable HMR
 */
if (module.hot) {
	console.info('Setting up HMR')

	
	// Main window or configurator - reboot app
	module.hot.accept(['./MainWindow','./MainConfigurator'], (mods) => {
		log.info("Rebooting main, updated dependencies",mods)

		// We get a reference to the new window here
		return boot().then(() => {
			const newWindow = mainWindow.getBrowserWindow()

			require('electron').BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow && win !== devWindow)
				.forEach(oldWindow => oldWindow.close())

		})

	})

	// Worst case - accept myself??
	module.hot.accept()

}
