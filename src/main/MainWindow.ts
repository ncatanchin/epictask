

import windowStateKeeper = require('electron-window-state')
import Electron = require('electron')
import {GitHubConfig,AuthKey,Events} from 'shared/Constants'
import GitHubOAuthWindow from './auth/GitHubOAuthWindow'
import {makeMainMenu as makeMainMenuType}  from './MainMenu'

const log = getLogger(__filename)
const path = require('path')
const {BrowserWindow,Menu,ipcMain} = Electron

const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-entry.html')
log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)

let menu
let browserWindow:Electron.BrowserWindow = null
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
	browserWindow = null
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

/**
 * Make menu function * HMR ready
 */
function makeMenu() {
	// Make the menu
	const makeMainMenu:typeof makeMainMenuType = require('./MainMenu').makeMainMenu
	menu = makeMainMenu(browserWindow)

	// Assign it based on OS
	Env.isOSX ? Menu.setApplicationMenu(menu) : browserWindow.setMenu(menu)
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
				defaultHeight: 728,
				file: 'main-window'
			})

			browserWindow = new BrowserWindow(Object.assign({}, mainWindowState, {
				show: false,
				frame: false,
				titleBarStyle: 'hidden',
				title: 'epictask',
				// darkTheme:true,
			}))


			mainWindowState.manage(browserWindow)

			log.info(`Template Path: ${templateURL}`)
			browserWindow.loadURL(templateURL)

			// On PageLoaded - show and focus
			browserWindow.webContents.on('did-finish-load',async () => {

				// If HMR event occured - only for dev
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


			makeMenu()


		} catch (err) {
			reject(err)
		}
	})
}

/**
 * HMR Enabled -> on dispose remove mainWindow
 */
if (module.hot) {
	module.hot.accept(['./MainMenu'],() => makeMenu())
	module.hot.accept(['!!file!./MainEntry.jade'], (updates) => {
		log.info("HMR update jade", updates)

		log.info(`Template Path: ${templateURL}`)
		browserWindow.loadURL(templateURL)
	})
}
