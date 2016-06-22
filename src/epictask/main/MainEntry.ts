//require('shared/SourceMapSupport')
import 'reflect-metadata'
import 'shared/ErrorHandling'
const electron = require('electron')

// LOGGING
import './MainLogging'


// LOAD EVERYTHING
import 'shared/Globals'

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
 * Load the window
 */
const loadWindow = () => require('./MainWindow')



/**
 * All windows closed
 */
function onAllClosed() {
	log.debug('All windows closed')

	if (process.platform !== 'darwin')
		app.quit()
}

async function boot() {
	global.MainBooted = false

	log.info('Loading the REDUX store')
	require('shared/store').getStore()
	log.info('Store built')

	mainWindow = loadWindow()

	await mainWindow.start(async () => {
		log.debug('Boot callback')

		const mainBoot = require('./MainBoot')
		const Services = await mainBoot()
		log.info(`Boot Completed, services include`, Object.keys(Services))



		return Services

	})

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

	module.hot.accept(['./MainWindow','./MainBoot'],async (mods) => {
		log.info("Rebooting main, updated dependencies",mods)

		// We get a reference to the new window here
		await boot()

		const newWindow = mainWindow.getBrowserWindow()

		// When it full loads we remove all the old ones
		newWindow.webContents.on('did-finish-load', () => {
			electron.BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow)
				.forEach(oldWindow => oldWindow.close())
		})

	})

}
