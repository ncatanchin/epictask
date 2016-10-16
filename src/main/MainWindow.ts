

import windowStateKeeper = require('electron-window-state')
import Electron = require('electron')
import {makeMainMenu as makeMainMenuType}  from './MainMenu'
import { getAppEntryHtmlPath } from "shared/util/TemplateUtil"
import { getAppActions } from "shared/actions/ActionFactoryProvider"
import { Events } from "shared/config/Events"
import { AllWindowDefaults, WindowIcon } from "shared/config/WindowConfig"
import { setupShutdownOnWindowClose } from "main/MainShutdownHandler"
import { setDataOnHotDispose, getHot } from "shared/util/HotUtils"

const
	log = getLogger(__filename),
	{BrowserWindow,Menu,ipcMain} = Electron,
	templateURL = 'file://' + getAppEntryHtmlPath()
	
// Jetbrains - for another time
//'http://localhost:63342/epictask/dist/app/app-entry.html'
log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)


let
	menu,
	browserWindow:Electron.BrowserWindow = getHot(module,'browserWindow',null)

setDataOnHotDispose(module,() => ({
	browserWindow
}))

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
	if (browserWindow)
		return Promise.resolve(true)
	
	return loadRootWindow(cb)
}

/**
 * Ready - initiates the app content load
 */
export function ready() {
	browserWindow.webContents.send(Events.MainReady)
	browserWindow.webContents.send(Events.ChildrenReady)
	
	getAppActions().setReady(true)
	
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
	// ONLY SET MAIN MENU ON MAC
	if (!Env.isMac)
		return
	
	const
		makeMainMenu:typeof makeMainMenuType = require('./MainMenu').makeMainMenu
	
	menu = makeMainMenu(browserWindow)
	Menu.setApplicationMenu(menu)
	
	
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
				file: 'main-window.state'
			})

			const
				windowOpts = Object.assign({},
					mainWindowState,
					AllWindowDefaults,
					Env.isMac && {
						//titleBarStyle: 'hidden'
						// darkTheme:true,
					}
				)
			
			browserWindow = new BrowserWindow(windowOpts)
			
			if (!Env.isMac) {
				browserWindow.setIcon(WindowIcon as any)
			}
			
			
			makeMenu()
			
			const
				{webContents} = browserWindow

			// ATTACH STATE HANDLER
			mainWindowState.manage(browserWindow)
			
			// ON READY - SHOW
			browserWindow.once('ready-to-show',() => browserWindow.show())
			
			setupShutdownOnWindowClose(browserWindow)
			
			// webContents.on('will-navigate',(event:any,url) => {
			// 	log.info(`App wants to navigate`,url)
			// 	event.returnValue = false
			// 	event.preventDefault()
			// })
			
			// On PageLoaded - show and focus
			webContents
				.once('did-finish-load', () => {
					
					// IN DEV - SHOW HERE
					// if (Env.isDev)
					// 	browserWindow.show()
					
					log.info(`MainWindow loaded, waiting for loader started`)
				})
			
			// WHEN LOADER SAYS ITS READY
			ipcMain.once('epictask-loader-ready',async () => {
				log.info(`Received READY from loader`)
				
				// If HMR event occurred - only for dev
				if (!browserWindow)
					return
				
				
				browserWindow.setTitle('EpicTask')
				browserWindow.show()
				browserWindow.focus()
				/**
				 * IN DEV MODE - NOT REMOTE RENDER DEBUG - SHOW DEV TOOLS
				 */
				if (Env.isDev && !Env.isRemote) {
					browserWindow.webContents.openDevTools()
				}
				
				
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

			


			


		} catch (err) {
			reject(err)
		}
	})
}
