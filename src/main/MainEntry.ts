const electron = require('electron')
const windowStateKeeper = require('electron-window-state')

import '../shared/CommonEntry'
import * as MainWindowType from './MainWindow'

const {app} = electron
const log = getLogger(__filename)

/**
 * HMR Configuration for development
 */
function isHotEnabled() {
	return Env.isHot
}
const hotReloadEnabled = Env.isHot
log.info(`Hot reload mode enabled: ${hotReloadEnabled}`)

/**
 * In debug mode enable remote debugging
 */
if (DEBUG) {
	app.commandLine.appendSwitch('remote-debugging-port', '8315');
	//app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');
}

/**
 * Load the window
 */
function loadWindow() {
	return require('./MainWindow') as typeof MainWindowType
}

let mainWindow = loadWindow()

/**
 * All windows closed
 */
function onAllClosed() {
	if (process.platform !== 'darwin')
		app.quit()
}

/**
 * App started
 */
function onStart() {
	app.setName('epic.ly')
	mainWindow.start()
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
		mainWindow.restart()
	})

}
