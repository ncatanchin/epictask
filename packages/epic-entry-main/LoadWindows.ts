//
// import Electron from 'epic-electron'
// import { makeMainMenu as makeMainMenuType } from "./MainMenu"
// import { getAppEntryHtmlPath, setDataOnHotDispose, getHot } from "epic-global"
// import { AllWindowDefaults, WindowIcon } from "epic-global"
// import { Events } from "epic-global/Constants"
// import { setupShutdownOnWindowClose } from "./MainShutdownHandler"
//
// const
// 	log = getLogger(__filename),
// 	windowStateKeeper = require('electron-window-state'),
// 	{BrowserWindow,Menu,screen,ipcMain} = Electron,
// 	appTemplateURL = 'file://' + getAppEntryHtmlPath()
//
// // Jetbrains - for another time
// //'http://localhost:63342/epictask/dist/app/app-entry.html'
// log.info(`Starting EpicTask (inDev=${Env.isDev})`,process.env.NODE_ENV)
//
// // If in debug mode then add electron-debug
// if ((Env.isDev || Env.isDev) && !Env.isRemote) {
// 	require('electron-debug')({})
// }
//
//
// /**
//  * Load the actual window
//  */
// function loadRootWindow(onFinishLoadCallback:(err?:Error) => void = null) {
//
//
// 	return new Promise((resolve,reject) => {
//
// 		try {
// 			log.debug('window is loading')
//
//
// 			let mainWindowState = windowStateKeeper({
// 				defaultWidth: 1024,
// 				defaultHeight: 728,
// 				file: 'main-window.state'
// 			})
//
// 			const
// 				windowOpts = Object.assign({},
// 					mainWindowState,
// 					AllWindowDefaults
// 				)
//
// 			appWindow = new BrowserWindow(windowOpts)
//
// 			if (!Env.isMac) {
// 				appWindow.setIcon(WindowIcon as any)
// 			}
//
//
// 			const
// 				{webContents} = appWindow
//
// 			// ATTACH STATE HANDLER
// 			mainWindowState.manage(appWindow)
//
// 			// ONLY TO DEBUG STARTUP ERRORS // ON READY - SHOW
// 			appWindow.once('ready-to-show',() => appWindow.show())
//
// 			setupShutdownOnWindowClose(appWindow)
//
//
// 			// On PageLoaded - show and focus
// 			webContents
// 				.once('did-finish-load', () => {
//
// 					// IN DEV - SHOW HERE
// 					// if (Env.isDev)
// 					// 	browserWindow.show()
//
// 					log.info(`MainWindow loaded, waiting for loader started`)
// 				})
//
// 			// WHEN LOADER SAYS ITS READY
// 			ipcMain.once(Events.UIReady,async () => {
// 				log.info(`Received READY from loader`)
//
// 				// If HMR event occurred - only for dev
// 				if (!appWindow)
// 					return
//
// 				//browserWindow.setTitle('EpicTask')
// 				appWindow.show()
// 				appWindow.focus()
// 				/**
// 				 * IN DEV MODE - NOT REMOTE RENDER DEBUG - SHOW DEV TOOLS
// 				 */
// 				if (Env.isDev && !Env.isRemote) {
// 					appWindow.webContents.openDevTools()
// 				}
//
//
// 			})
//
// 			ipcMain.once('epictask-start-children',async () => {
// 				if (onFinishLoadCallback) {
// 					const result:any = onFinishLoadCallback()
// 					if (result && result.then) {
// 						log.info('waiting for window did-finish-load callback to complete')
// 						await result
// 					}
// 				}
//
// 				return resolve(appWindow)
// 			})
// 			appWindow.webContents.on('did-fail-load',(event, code) => {
// 				log.error('Failed to load content',event,code)
// 				if (code === 3)
// 					return
//
//
// 				reject(new Error(`ui code did not load ${code}`))
//
// 			})
// 			log.info(`Template Path: ${appTemplateURL}`)
// 			appWindow.loadURL(appTemplateURL)
// 			appWindow.on('closed', () => {
// 				appWindow = null
// 			})
//
//
//
//
//
//
//
// 		} catch (err) {
// 			reject(err)
// 		}
// 	})
// }
//
//
