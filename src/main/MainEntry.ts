///<reference path="../../typings/main.d.ts"/>

import { app, BrowserWindow, Menu, shell } from 'electron'
import windowStateKeeper = require('electron-window-state')
import * as path from 'path'
import {toDataUrl} from 'shared/util/Templates'
import * as Log from 'typelogger'
import * as MainWindowType from './MainWindow'
let MainWindow = MainWindowType


const log = Log.create(__filename)
const hotReloadEnabled = !!process.env.HOT
if (hotReloadEnabled)
	log.info('Hot reload mode enabled')

log.info('starting')
let inHotReload = false

app.on('window-all-closed', () => {
	if (hotReloadEnabled) {
		log.info('Skipping QUIT, in HOT mode')
		return
	}

	log.info('> all-closed')
	if (process.platform !== 'darwin' && !inHotReload)
		app.quit()
})


app.on('ready', MainWindow.start)


/**
 * If in dev with HMR enabled
 */
if (module.hot) {
	console.info('Setting up HMR')

	module.hot.accept(['./MainWindow'],(mods) => {
		log.info("Accepting updates for",mods)
		MainWindow = require('./MainWindow')
		MainWindow.restart()
	})

}
