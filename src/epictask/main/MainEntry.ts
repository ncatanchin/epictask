//require('shared/SourceMapSupport')
import 'reflect-metadata'
import 'shared/ErrorHandling'
const electron = require('electron')

// LOAD EVERYTHING
import 'shared/Globals'

// LOGGING
import './MainLogging'




const {app} = electron
const log = getLogger(__filename)

/**
 * Main window ref
 */
let mainWindow:any

/**
 * HMR Configuration for development
 */

const hotReloadEnabled = Env.isHot
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
 * Bind events
 */

if (!Env.isHot)
	app.on('window-all-closed', onAllClosed)

app.on('ready', onStart)


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

			electron.BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow)
				.forEach(oldWindow => oldWindow.close())

			// When it full loads we remove all the old ones
			// newWindow.webContents.on('did-finish-load', () => {
			//
			// })
		})

	})

}
