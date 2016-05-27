import 'shared/CommonEntry'

import { app } from 'electron'
import windowStateKeeper = require('electron-window-state')
import * as MainWindowType from './MainWindow'

const log = getLogger(__filename)
const hotReloadEnabled = !!process.env.HOT
if (hotReloadEnabled)
	log.info('Hot reload mode enabled')

log.info('starting')
let inHotReload = false

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

	if (hotReloadEnabled) {
		log.info('Skipping QUIT, in HOT mode')
		return
	}

	log.info('> all-closed')
	if (process.platform !== 'darwin' && !inHotReload)
		app.quit()

}

/**
 * App started
 */
function onStart() {
	mainWindow.start()
}

/**
 * Bind events
 */
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
