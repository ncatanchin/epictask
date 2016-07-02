import * as fs from 'fs'
import * as path from 'path'

import electron = require('electron')
const{ app, BrowserWindow, Menu, shell,ipcMain,dialog } = electron

import windowStateKeeper = require('electron-window-state')
import * as Log from 'typelogger'
import {GitHubConfig,AuthKey,Events} from 'shared/Constants'
import GitHubOAuthWindow from './auth/GitHubOAuthWindow'
import {makeMainMenu} from './MainMenu'


const log = Log.create(__filename)
log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)

let menu
let template
let browserWindow:Electron.BrowserWindow = null
let firstLoad = true

let webContentLoaded = false
let mainReady = false

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
	browserWindow = null
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
export function start(cb = null) {
	log.info('> start')
	return loadRootWindow(cb)
}

/**
 * Ready - initiates the app content load
 */
export function ready() {
	browserWindow.webContents.send(Events.MainReady)
}

/**
 * Retrieve the current browser window
 *
 * @returns {BrowserWindow}
 */
export function getBrowserWindow() {
	return browserWindow
}



function makeMainTemplate() {
	const cssGlobal = require('!!raw!sass!styles/MainEntry.global.scss')
	const mainTemplatePath = require('!!file!./MainEntry.jade')
	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')

	const pug = require('pug')
	const mainTemplate = pug.render(mainTemplateSrc,{
		cssGlobal,
		Env,
		baseDir:path.resolve(__dirname,'../../..'),
		Events
	})
	let templatePath = app.getPath('temp') + '/entry-' + require('node-uuid').v4() + '.html'
	fs.writeFileSync(templatePath,mainTemplate)

	templatePath = 'file://' + templatePath
	return templatePath
}
/**
 * Load the actual window
 */
function loadRootWindow(onFinishLoadCallback:(err?:Error) => void = null) {
	return new Promise((resolve,reject) => {

		try {
			log.debug('window is loading')

			let mainWindowState = windowStateKeeper({
				defaultWidth: 1024,
				defaultHeight: 728
			})

			browserWindow = new BrowserWindow(Object.assign({}, mainWindowState, {
				show: true,
				frame: false,
				titleBarStyle: 'hidden',
				// darkTheme:true,
				title: 'epictask'
			}))


			mainWindowState.manage(browserWindow)

			const templateURL = makeMainTemplate()
			log.info(`Template Path: ${templateURL}`)
			browserWindow.loadURL(templateURL)

			/**
			 * On PageLoaded - show and focus
			 */
			browserWindow.webContents.on('did-finish-load',async () => {
				if (!browserWindow)
					return

				browserWindow.setTitle('EpicTask')
				browserWindow.show()

				if (firstLoad)
					browserWindow.focus()

				firstLoad = false


				if (onFinishLoadCallback) {
					const result:any = onFinishLoadCallback()
					if (result && result.then) {
						log.info('waiting for window did-finish-load callback to complete')
						await result
					}
				}

				return resolve(browserWindow)
			})

			browserWindow.webContents.on('did-fail-load',(event,code) => {
				if (code === 3)
					return

				log.error('Failed to load content',event,code)
				reject(new Error(`ui code did not load ${code}`))

			})

			browserWindow.on('closed', () => {
				browserWindow = null
			})

			/**
			 * IN DEV MODE - NOT REMOTE RENDER DEBUG - SHOW DEV TOOLS
			 */
			if (Env.isDev && !Env.isRemote) {
				browserWindow.webContents.openDevTools()
			}


			// Make the menu
			menu = makeMainMenu(browserWindow)

			// Assign it based on OS
			Env.isOSX ? Menu.setApplicationMenu(menu) : browserWindow.setMenu(menu)


		} catch (err) {
			reject(err)
		}
	})
}

/**
 * HMR Enabled -> on dispose remove mainWindow
 */
if (module.hot) {
	module.hot.accept(['!!file!./MainEntry.jade'], (updates) => {
		log.info("HMR update jade", updates)

		const templateURL = makeMainTemplate()
		log.info(`Template Path: ${templateURL}`)
		browserWindow.loadURL(templateURL)
	})
}
