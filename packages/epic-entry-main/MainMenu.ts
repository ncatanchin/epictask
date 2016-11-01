import Electron = require('electron')
import Cleaner from "./Cleaner"
import { shutdownApp } from "./MainShutdownHandler"

const
	{
		BrowserWindow,
		Menu
	} = Electron,
	log = getLogger(__filename)


/**
 * Create Dev Menu
 */
function makeDevMenu() {
	return {
		label: 'Dev',
		submenu: [
			{
				// Toggle developer tools
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click: () => BrowserWindow.getFocusedWindow().webContents.toggleDevTools()
			},
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
				accelerator: 'Control+F8',
				click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('debugger;')
			},
			
			// CLEAN
			{
				label: 'Clean / Reset App',
				click: () => Cleaner.restartAndClean()
			}
		
		]
	}
}


export function makeMainMenu() {
	
	
	if (!Env.isMac)
		return null
	
	const
		template = [ {
			label: 'EpicTask',
			submenu: [ {
				label: 'About EpicTask',
				selector: 'orderFrontStandardAboutPanel:'
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
		}, {
			label: 'View',
			submenu: [
				{
					label: 'Toggle Full Screen',
					accelerator: 'Ctrl+Command+F',
					click() {
						const
							win = BrowserWindow.getFocusedWindow()
							
						win && win.setFullScreen(!win.isFullScreen())
					}
				}
			]
		}
	] as any
	
	
	//if (Env.isDev)
		template.push(makeDevMenu())
	
	
	return Menu.buildFromTemplate(template)
}


/**
 * Execute load
 */
export function execute() {
	// ONLY SET MAIN MENU ON MAC
	if (!Env.isMac)
		return
	
	Menu.setApplicationMenu(makeMainMenu())
}