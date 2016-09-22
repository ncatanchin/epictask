

import windowStateKeeper = require('electron-window-state')
import Electron = require('electron')
import {GitHubConfig,AuthKey,Events} from 'shared/Constants'
import GitHubOAuthWindow from './auth/GitHubOAuthWindow'
import {makeMainMenu as makeMainMenuType}  from './MainMenu'

const log = getLogger(__filename)
const path = require('path')
const {BrowserWindow,Menu,ipcMain} = Electron


//const templateURL = 'file://' + path.resolve(process.cwd(),'dist/app',require('!!file!pug-html!assets/templates/MainEntry.jade'))
const
	templateURL = 'file://' + path.resolve(process.cwd(),'dist/app/app-entry.html')
	
// Jetbrains - for another time
//'http://localhost:63342/epictask/dist/app/app-entry.html'
log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)

let
	menu,
	browserWindow:Electron.BrowserWindow = null,
	firstLoad = true

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
	browserWindow.webContents.send('epictask-children-ready')
	
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
	makeMenu()
	
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
			
			
			
			
			const
				{webContents} = browserWindow


			mainWindowState.manage(browserWindow)
			
			browserWindow.show()
			
			
			// On PageLoaded - show and focus
			
			webContents
				.once('did-finish-load', () => {
					if (Env.isDev)
						browserWindow.show()
					log.info(`MainWindow loaded, waiting for loader started`)
					
					
				})
			ipcMain.once('epictask-loader-ready',async () => {
				log.info(`Received READY from loader`)
				// If HMR event occurred - only for dev
				if (!browserWindow)
					return
				
				
				browserWindow.setTitle('EpicTask')
				browserWindow.show()
				browserWindow.focus()
				
				
			})
			
			ipcMain.once('epictask-start-children',async () => {
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
				log.error('Failed to load content',event,code)
				if (code === 3)
					return

				
				reject(new Error(`ui code did not load ${code}`))

			})
			log.info(`Template Path: ${templateURL}`)
			browserWindow.loadURL(templateURL)
			browserWindow.on('closed', () => {
				browserWindow = null
			})

			/**
			 * IN DEV MODE - NOT REMOTE RENDER DEBUG - SHOW DEV TOOLS
			 */
			if (Env.isDev && !Env.isRemote) {
				browserWindow.webContents.openDevTools()
			}


			


		} catch (err) {
			reject(err)
		}
	})
}
