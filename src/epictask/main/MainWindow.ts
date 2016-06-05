
const { app, BrowserWindow, Menu, shell,ipcMain,dialog } = require('electron')

import windowStateKeeper = require('electron-window-state')
import * as Log from 'typelogger'
import {GitHubConfig,AuthKey} from '../shared/Constants'
import GitHubOAuthWindow from './auth/GitHubOAuthWindow'
const log = Log.create(__filename)
log.info(`Starting GITTUS (inDev=${Env.isDev})`,process.env.NODE_ENV)

let menu
let template
let mainWindow = null


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
	//{showDevTools: true}
	require('electron-debug')({})
}

export function stop() {
	console.info('disposing main')

	if (mainWindow) {
		//mainWindow.close()
	}
	// while (true) {
	// 	const allWindows = BrowserWindow.getAllWindows()
	// 	if (!allWindows || allWindows.length === 0)
	// 		break
	//
	// 	try {
	// 		const win = allWindows.pop()
	// 		win && win.close()
	// 	} catch (err) {
	// 		log.warn('Unable to close window',err)
	// 	}
	// }

	mainWindow = null
}

/**
 * Kills all existing windows and then
 * launches a new one
 */
export function restart() {
	log.info('> restart')

	stop()
	start()

	return this
}

/**
 * Start the main window
 */
export function start() {
	log.info('> start')
	loadRootWindow()
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

	const templatePath = 'file://' + require('!!file?name=[name].html!..//tools/jade-template-loader!./MainEntry.jade')
	log.info(`Template Path: ${templatePath}`)
	mainWindow.loadURL(templatePath)

	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.show()
		mainWindow.focus()
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	log.debug('debug = ',DEBUG,'dev',Env.isDev,'remote',process.env.REMOTE,Env)
	if (Env.isDev && !Env.isRemote) {
		mainWindow.openDevTools()
	}

	if (process.platform === 'darwin') {
		template = [{
			label: 'Super-Duper',
			submenu: [{
				label: 'About ElectronReact',
				selector: 'orderFrontStandardAboutPanel:'
			}, {
				type: 'separator'
			}, {
				label: 'Services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				label: 'Hide ElectronReact',
				accelerator: 'Command+H',
				selector: 'hide:'
			}, {
				label: 'Hide Others',
				accelerator: 'Command+Shift+H',
				selector: 'hideOtherApplications:'
			}, {
				label: 'Show All',
				selector: 'unhideAllApplications:'
			}, {
				type: 'separator'
			}, {
				label: 'Quit',
				accelerator: 'Command+Q',
				click() {
					app.quit()
				}
			}]
		}, {
			label: 'Edit',
			submenu: [{
				label: 'Undo',
				accelerator: 'Command+Z',
				selector: 'undo:'
			}, {
				label: 'Redo',
				accelerator: 'Shift+Command+Z',
				selector: 'redo:'
			}, {
				type: 'separator'
			}, {
				label: 'Cut',
				accelerator: 'Command+X',
				selector: 'cut:'
			}, {
				label: 'Copy',
				accelerator: 'Command+C',
				selector: 'copy:'
			}, {
				label: 'Paste',
				accelerator: 'Command+V',
				selector: 'paste:'
			}, {
				label: 'Select All',
				accelerator: 'Command+A',
				selector: 'selectAll:'
			}]
		}, {
			label: 'View',
			submenu: (Env.isDebug) ? [{
				label: 'Reload',
				accelerator: 'Command+R',
				click() {
					mainWindow.reload()
				}
			},{
				label: 'Break',
				accelerator: 'Command+F8',
				click() {
					//mainWindow.debugger.attach()
					mainWindow.webContents.executeJavaScript('debugger;')
				}
			}, {
				label: 'Toggle Full Screen',
				accelerator: 'Ctrl+Command+F',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}, {
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click() {
					mainWindow.toggleDevTools()
				}
			}] : [{
				label: 'Toggle Full Screen',
				accelerator: 'Ctrl+Command+F',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}]
		}, {
			label: 'Window',
			submenu: [{
				label: 'Minimize',
				accelerator: 'Command+M',
				selector: 'performMiniaturize:'
			}, {
				label: 'Close',
				accelerator: 'Command+W',
				selector: 'performClose:'
			}, {
				type: 'separator'
			}, {
				label: 'Bring All to Front',
				selector: 'arrangeInFront:'
			}]
		}, {
			label: 'Help',
			submenu: [{
				label: 'Learn More',
				click() {
					shell.openExternal('http://electron.atom.io')
				}
			}, {
				label: 'Documentation',
				click() {
					shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme')
				}
			}, {
				label: 'Community Discussions',
				click() {
					shell.openExternal('https://discuss.atom.io/c/electron')
				}
			}, {
				label: 'Search Issues',
				click() {
					shell.openExternal('https://github.com/atom/electron/issues')
				}
			}]
		}]

		menu = Menu.buildFromTemplate(template)
		Menu.setApplicationMenu(menu)
	} else {
		template = [{
			label: '&File',
			submenu: [{
				label: '&Open',
				accelerator: 'Ctrl+O'
			}, {
				label: '&Close',
				accelerator: 'Ctrl+W',
				click() {
					mainWindow.close()
				}
			}]
		}, {
			label: '&View',
			submenu: (process.env.NODE_ENV === 'development') ? [{
				label: '&Reload',
				accelerator: 'Ctrl+R',
				click() {
					mainWindow.restart()
				}
			}, {
				label: 'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}, {
				label: 'Toggle &Developer Tools',
				accelerator: 'Alt+Ctrl+I',
				click() {
					mainWindow.toggleDevTools()
				}
			}] : [{
				label: 'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}]
		}, {
			label: 'Help',
			submenu: [{
				label: 'Learn More',
				click() {
					shell.openExternal('http://electron.atom.io')
				}
			}, {
				label: 'Documentation',
				click() {
					shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme')
				}
			}, {
				label: 'Community Discussions',
				click() {
					shell.openExternal('https://discuss.atom.io/c/electron')
				}
			}, {
				label: 'Search Issues',
				click() {
					shell.openExternal('https://github.com/atom/electron/issues')
				}
			}]
		}]
		menu = Menu.buildFromTemplate(template)
		mainWindow.setMenu(menu)
	}
}

/**
 * HMR Enabled -> on dispose remove mainWindow
 */
if (module.hot) {
	module.hot.dispose(() => {
		if (mainWindow) {
			mainWindow.close()
			mainWindow = null
		}
	})
}
