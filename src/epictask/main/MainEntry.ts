require('shared/SourceMapSupport')
import 'shared/ErrorHandling'

import 'reflect-metadata'
const electron = require('electron')

// LOGGING
import './MainLogging'


// LOAD EVERYTHING
import 'shared/Globals'


import * as MainWindowType from './MainWindow'
const {app} = electron
const log = getLogger(__filename)

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
const loadWindow = () => require('./MainWindow') as typeof MainWindowType

let mainWindow = loadWindow()

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

	mainWindow.start()
	require('./MainBoot')
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

	module.hot.accept(['./MainWindow'],(mods) => {
		log.info("Accepting updates for",mods)
		mainWindow = loadWindow()

		// We get a reference to the new window here
		const newWindow = mainWindow.restart()

		// When it full loads we remove all the old ones
		newWindow.webContents.on('did-finish-load', () => {
			electron.BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow)
				.forEach(oldWindow => oldWindow.close())
		})



	})

}
