import * as fs from 'fs'
import * as path from 'path'
import {toDataUrl} from '../shared/util/Templates'
const { app, BrowserWindow, Menu, shell,ipcMain,dialog } = require('electron')

import windowStateKeeper = require('electron-window-state')
import * as Log from 'typelogger'
import {GitHubConfig,AuthKey} from '../shared/Constants'
import GitHubOAuthWindow from './auth/GitHubOAuthWindow'
import {makeMainMenu} from './MainMenu'

const log = Log.create(__filename)
log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)

let menu
let template
let mainWindow = null
let firstLoad = true

ipcMain.on(AuthKey,(event,arg) => {
	log.info('Got auth request',event,arg)

	//const OAuthGithub = require('electron-oauth-github')
	const authRequest = new GitHubOAuthWindow(GitHubConfig)

	authRequest.startRequest(function(err,token) {
		if (err) {
			log.error(err);
		}

		event.sender.send(AuthKey,{token})
		log.info('GH token received: ' + token)
	});
})

// If in debug mode then add electron-debug
if ((Env.isDev || Env.isDev) && !Env.isRemote) {
	require('electron-debug')({})
}

export function stop() {
	console.info('disposing main')
	mainWindow = null
}

/**
 * Kills all existing windows and then
 * launches a new one
 */
export function restart() {


	return start()
}

/**
 * Start the main window
 */
export function start() {
	log.info('> start')
	return loadRootWindow()
}



function makeMainTemplate() {
	const cssGlobal = require('!!raw!sass!styles/MainEntry.global.scss')
	const mainTemplatePath = require('!!file!./MainEntry.jade')
	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')

	const pug = require('pug')
	const mainTemplate = pug.render(mainTemplateSrc,{
		cssGlobal,
		Env,
		baseDir:path.resolve(__dirname,'../../..')
	})
	let templatePath = app.getPath('temp') + '/entry-' + require('node-uuid').v4() + '.html'
	fs.writeFileSync(templatePath,mainTemplate)

	templatePath = 'file://' + templatePath
	return templatePath
}
/**
 * Load the actual window
 */
function loadRootWindow() {
	log.info('> ready')

	let mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 728
	})

	mainWindow = new BrowserWindow(Object.assign({},mainWindowState,{
		show: true,
		frame: false,
		//titleBarStyle: 'hidden',
		darkTheme:true,
		title: 'epictask'
	}))


	mainWindowState.manage(mainWindow)

	const templateURL = makeMainTemplate()
	log.info(`Template Path: ${templateURL}`)
	mainWindow.loadURL(templateURL)

	/**
	 * When the page loads, let's show it and focus
	 */
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.setTitle('EpicTask')

		mainWindow.show()

		if (firstLoad)
			mainWindow.focus()

		firstLoad = false
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	/**
	 * IN DEV MODE - NOT REMOTE RENDER DEBUG - SHOW DEV TOOLS
	 */
	if (Env.isDev && !Env.isRemote) {
		mainWindow.openDevTools()
	}


	// Make the menu
	menu = makeMainMenu(mainWindow)

	// Assign it based on OS
	Env.isOSX ? Menu.setApplicationMenu(menu) : mainWindow.setMenu(menu)

	return mainWindow
}

/**
 * HMR Enabled -> on dispose remove mainWindow
 */
if (module.hot) {
	module.hot.accept(['!!file!./MainEntry.jade'], (updates) => {
		log.info("HMR update jade", updates)

		const templateURL = makeMainTemplate()
		log.info(`Template Path: ${templateURL}`)
		mainWindow.loadURL(templateURL)

		// if (mainWindow) {
		// 	mainWindow.close()
		// 	mainWindow = null
		// }
		//
		// loadRootWindow()
	})

	// module.hot.dispose(() => {
	// 	if (mainWindow) {
	// 		mainWindow.close()
	// 		mainWindow = null
	// 	}
	// })
}
