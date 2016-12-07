import Electron from 'epic-electron'
import Cleaner from "./Cleaner"
import { shutdownApp } from "./MainShutdownHandler"

const
	{
		BrowserWindow,
		Menu,
		app,
		globalShortcut
	} = Electron,
	log = getLogger(__filename),
	
	DevToolCommands = [
		{
			// Toggle developer tools
			label: 'Toggle Developer Tools',
			accelerator: 'CommandOrControl+Alt+I',
			click: () => BrowserWindow.getFocusedWindow().webContents.toggleDevTools()
		},
		// Start Perf
		{
			label: 'Start Perf',
			accelerator: 'Ctrl+Alt+P',
			click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('Perf.start()')
		},
		
		// Stop Perf
		{
			label: 'Stop Perf',
			accelerator: 'Ctrl+Shift+Alt+P',
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


function onBlur() {
	log.info(`Window blur - removing accelerators`)
	DevToolCommands
		.filter((cmd:any) => cmd.accelerator && cmd.click)
		.forEach((cmd:any) => globalShortcut.unregister(cmd.accelerator))
}

function onFocus() {
	log.info(`Window focus - adding accelerators`)
	DevToolCommands
		.filter((cmd:any) => cmd.accelerator && cmd.click)
		.forEach((cmd:any) => globalShortcut.register(cmd.accelerator,cmd.click))
}

function setupShortcuts() {
	if (Env.isDev || Env.EnableDebug) {
		app.on('browser-window-focus', onFocus)
		app.on('browser-window-blur', onBlur)
	}
}

/**
 * Create Dev Menu
 */
function makeDevMenu() {
	return {
		label: 'Dev',
		submenu: DevToolCommands
	}
}

/**
 * For dev purposes - create s simple menu
 *
 * @returns {any}
 */
export function createDevWindowMenu() {
	return Menu.buildFromTemplate([makeDevMenu()])
}



export function makeMainMenu() {
	
	
	if (!Env.isMac) {
		
		return null
	}
	const
		template = [ {
			label: app.getName(),
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
				role: 'quit'
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
	
	
	if (Env.isDev)
		template.push(makeDevMenu())
	
	
	return Menu.buildFromTemplate(template)
}


/**
 * Execute load
 */
export function execute() {
	// ONLY SET MAIN MENU ON MAC
	if (!Env.isMac) {
		setupShortcuts()
		return
	}
	Menu.setApplicationMenu(makeMainMenu())
}