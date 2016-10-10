import Electron = require('electron')
import { Container } from 'typescript-ioc'
import { UIActionFactory } from 'shared/actions/ui/UIActionFactory'
import { AuthKey } from "shared/Constants"
import { ActionFactoryProviders } from  "shared/actions/ActionFactoryProvider"
import { shutdownApp } from "main/MainShutdownHandler"

const
	{
		app,
		BrowserWindow,
		Menu,
		shell,
		ipcMain,
		dialog
	} = Electron,
	log = getLogger(__filename)


function makeDevMenu(mainWindow) {
	return {
		label: 'Dev',
		submenu: [
			
			// Start Perf
			{
				label: 'Start Perf',
				accelerator: 'Ctrl+P',
				click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('Perf.start()')
			},
			
			// Stop Perf
			{
				label: 'Stop Perf',
				accelerator: 'Ctrl+Shift+P',
				click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript(`
					Perf.stop();
					measurements = Perf.getLastMeasurements();
					Perf.printInclusive(measurements);
					Perf.printWasted(measurements);
				`)
			},
			
			// Reload
			{
				label: 'Reload',
				accelerator: 'Command+Shift+R',
				click: () => BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache()
			},
			
			// Break
			{
				label: 'Break',
				accelerator: 'Command+F8',
				click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('debugger;')
			},
			
			// CLEAN
			{
				label: 'Clean / Reset App',
				click: () => {
					
					
					const
						opts = {args: ['clean']} //process.argv.slice(1).filter(it => it !== 'clean').concat(['clean'])
					
					if (DEBUG)
						opts.args.unshift(process.argv[process.argv.length - 1])
					
					log.info(`relaunching with args: ${opts}`)
					app.relaunch(opts)
					app.exit(0)
				}
			}
		
		
		]
	}
}


function makeViewMenu(mainWindow) {
	return {
		label: 'View',
		submenu: [
			{
				label: 'Toggle StatusBar',
				//accelerator: 'Command+3',
				click() {
					Container.get(UIActionFactory)
						.toggleStatusBar()
				}
			},
			{
				label: 'Toggle Repo Panel',
				accelerator: 'Command+3',
				click() {
					Container.get(UIActionFactory)
						.toggleRepoPanelOpen()
				}
			}, {
				label: 'Toggle Full Screen',
				accelerator: 'Ctrl+Command+F',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}
		]
	}
}

export function makeMainMenu(mainWindow:Electron.BrowserWindow) {
	let template
	let menu
	
	const viewMenu = makeViewMenu(mainWindow)
	
	if (process.platform === 'darwin') {
		template = [ {
			label: 'EpicTask',
			submenu: [ {
				label: 'About EpicTask',
				selector: 'orderFrontStandardAboutPanel:'
			}, {
				type: 'separator'
			}, {
				label: 'Signout...',
				accelerator: 'Command+L',
				click() {
					ActionFactoryProviders[ AuthKey ].logout()
				}
			}, {
				type: 'separator'
			}, {
				label: 'Services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				label: 'Hide EpicTask',
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
				click: shutdownApp
			} ]
		}, {
			label: 'Edit',
			submenu: [ {
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
			} ]
		},
			
			viewMenu,
			{
				label: 'Window',
				submenu: [
					{
						label: 'Minimize',
						accelerator: 'Command+M',
						selector: 'performMiniaturize:'
					}, {
						type: 'separator'
					}, {
						label: 'Bring All to Front',
						selector: 'arrangeInFront:'
					}, {
						// Toggle developer tools
						label: 'Toggle Developer Tools',
						accelerator: 'Alt+Command+I',
						click: () => BrowserWindow.getFocusedWindow().webContents.toggleDevTools()
					}
				]
			} ]
		
		
	} else {
		template = [ {
			
			// FILE MENU
			label: '&File',
			
			
			submenu: [ {
				
				// SIGNOUT
				label: '&Signout...',
				accelerator: 'Ctrl+Super+L',
				click() {
					ActionFactoryProviders[ AuthKey ].logout()
				}
			}, {
				// QUIT
				label: '&Quit',
				accelerator: 'Ctrl+Q',
				click: shutdownApp
			
			} ]
		}, {
			label: '&View',
			submenu: (Env.isDev) ? [ {
				label: '&Reload',
				accelerator: 'Ctrl+R',
				click() {
					//mainWindow.restart()
					//mainWindow.webContents.executeJavaScript('window.loadEpicTask()')
					mainWindow.reload()
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
					(mainWindow as any).toggleDevTools()
				}
			} ] : [ {
				label: 'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			} ]
		} ]
		
		
	}
	
	if (Env.isDev)
		template.push(makeDevMenu(mainWindow))
	
	menu = Menu.buildFromTemplate(template)
	
	return menu
}