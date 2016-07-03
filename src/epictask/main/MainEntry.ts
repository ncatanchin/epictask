import 'reflect-metadata'
import 'shared/ErrorHandling'
import Electron = require('electron')
const {app} = Electron

// LOAD EVERYTHING
//import {window as DevToolWindowType} from './MainDevToolWindow'
import 'shared/Globals'

// LOGGING
import './MainLogging'
const log = getLogger(__filename)






// Main window ref
let mainWindow:any

// HMR Configuration for development
const hotReloadEnabled = Env.isHot

// Reference for dev monitor window (redux, etc)
let devWindow = null

log.info(`Hot reload mode enabled: ${hotReloadEnabled}`)

/**
 * In debug mode enable remote debugging
 */
if (DEBUG) {
	app.commandLine.appendSwitch('remote-debugging-port', '8315');
}


/**
 * All windows closed
 */
function onAllClosed() {
	log.debug('All windows closed')

	if (process.platform !== 'darwin')
		app.quit()
}

async function boot() {
	log.info("Boot start")
	global.MainBooted = false

	const configurator = require('./MainConfigurator')

	log.info("Boot init")
	await configurator.init()

	log.info("Boot load window")
	mainWindow = require('./MainWindow')

	if (Env.isDev && !devWindow) {
		devWindow = require('./MainDevToolWindow').window as Electron.BrowserWindow
	}


	log.info("Boot start")
	await mainWindow.start(async () => {
		log.debug('Boot callback')

		const Services = await configurator.start()
		log.info(`Boot Completed, services include`, Object.keys(Services))

		return Services
	})


	log.info("Boot complete, call ready")
	// Notifying the main window that we are ready
	global.MainBooted = true
	const {AppActionFactory} = require('shared/actions/AppActionFactory')
	const appActions = new AppActionFactory()
	appActions.setReady(true)
	mainWindow.ready()
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
	if (mainWindow) {
		const win = mainWindow.getBrowserWindow()
		if (win.isMinimized())
			win.restore()
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

	app.on('ready', onStart)
}


/**
 * Enable HMR
 */
if (module.hot) {
	console.info('Setting up HMR')

	module.hot.accept(['./MainWindow','./MainConfigurator'], (mods) => {
		log.info("Rebooting main, updated dependencies",mods)

		// We get a reference to the new window here
		return boot().then(() => {
			const newWindow = mainWindow.getBrowserWindow()

			Electron.BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow && win !== devWindow)
				.forEach(oldWindow => oldWindow.close())

			// When it full loads we remove all the old ones
			// newWindow.webContents.on('did-finish-load', () => {
			//
			// })
		})

	})

}
