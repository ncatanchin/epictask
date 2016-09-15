import Electron = require('electron')
import {Container} from 'typescript-ioc'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import { getActionClient, getStateValue } from "shared/AppStoreClient"
import { UIKey, RepoKey, AuthKey } from "shared/Constants"
import { ActionFactoryProviders } from "shared/actions/ActionFactoryProvider"

const
	{
		app,
		BrowserWindow,
		Menu,
		shell,
		ipcMain,
		dialog
	} = Electron

const log = getLogger(__filename)


function makeDevMenu(mainWindow) {
	return {
		label: 'Dev',
		submenu: [
			
			// Start Perf
			{
				label: 'Start Perf',
				accelerator: 'Ctrl+P',
				click: () => mainWindow.webContents.executeJavaScript('Perf.start()')
			},
			
			// Stop Perf
			{
				label: 'Stop Perf',
				accelerator: 'Ctrl+Shift+P',
				click: () => mainWindow.webContents.executeJavaScript(`
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
				click: () => mainWindow.reload()
			},
			
			// Break
			{
				label: 'Break',
				accelerator: 'Command+F8',
				click: () => mainWindow.webContents.executeJavaScript('debugger;')
			},
			
			// Toggle developer tools
			{
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click: () => (mainWindow as any).toggleDevTools()
			}
		]
	}
}

/* Repos Menu */
const reposMenu = {
	label: 'Repos',
	submenu: [{
		label: 'Add a Repo',
		accelerator: 'CmdOrCtrl+Shift+N',
		click() {
			log.debug('Sending add new repo')
			const actions = getActionClient(UIKey) as UIActionFactory
			actions.showAddRepoDialog()
		}
	},{
		label: 'Synchronize All',
		accelerator: 'Ctrl+S',
		click: () => {
			log.debug('Sending sync all repos')
			const actions = ActionFactoryProviders[RepoKey]
			actions.syncAll()
			
			
		}
	}]
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
			},{
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
		template = [{
			label: 'EpicTask',
			submenu: [{
				label: 'About EpicTask',
				selector: 'orderFrontStandardAboutPanel:'
			},{
				type: 'separator'
			}, {
				label: 'Signout...',
				accelerator: 'Command+L',
				click() {
					ActionFactoryProviders[AuthKey].logout()
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
				click() {
					app.quit()
				}
			}]
		},{
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
		},reposMenu, viewMenu, {
			label: 'Window',
			submenu: [{
				label: 'Minimize',
				accelerator: 'Command+M',
				selector: 'performMiniaturize:'
			}, {
				type: 'separator'
			}, {
				label: 'Bring All to Front',
				selector: 'arrangeInFront:'
			}]
		}]


	} else {
		template = [{
			label:   '&File',
			submenu: [{
				label: 'Signout...',
				accelerator: 'Command+L',
				click() {
					ActionFactoryProviders[AuthKey].logout()
				}
			}]
		}, {
			label:   '&View',
			submenu: (Env.isDev) ? [{
				label:       '&Reload',
				accelerator: 'Ctrl+R',
				click() {
					//mainWindow.restart()
					//mainWindow.webContents.executeJavaScript('window.loadEpicTask()')
					mainWindow.reload()
				}
			}, {
				label:       'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}, {
				label:       'Toggle &Developer Tools',
				accelerator: 'Alt+Ctrl+I',
				click() {
					(mainWindow as any).toggleDevTools()
				}
			}] : [{
				label:       'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}]
		}]


	}

	if (Env.isDev)
		template.push(makeDevMenu(mainWindow))

	menu = Menu.buildFromTemplate(template)

	return menu
}