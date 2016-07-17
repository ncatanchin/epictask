import Electron = require('electron')
import {Container} from 'typescript-ioc'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {getStoreState} from 'shared/store/AppStore'
import {enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {AuthActionFactory} from 'shared/actions/auth/AuthActionFactory'
const { app, BrowserWindow, Menu, shell,ipcMain,dialog } = Electron
const log = getLogger(__filename)


function makeDevMenu(mainWindow) {
	return {
		label: 'Dev',
		submenu: [
			{
				label: 'Start Perf',
				accelerator: 'Ctrl+P',
				click() {
					mainWindow.webContents.executeJavaScript('Perf.start()')
					//mainWindow.reload()
				}
			},{
				label: 'Stop Perf',
				accelerator: 'Ctrl+Shift+P',
				click() {
					mainWindow.webContents.executeJavaScript(`
						Perf.stop();
						measurements = Perf.getLastMeasurements();
						Perf.printInclusive(measurements);
						Perf.printWasted(measurements);
					`)
					//mainWindow.reload()
				}
			},{
				label: 'Reload',
				accelerator: 'Command+Shift+R',
				click() {
					//mainWindow.webContents.executeJavaScript('window.loadEpicTask()')
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
				label: 'Toggle Developer Tools',
				accelerator: 'Alt+Command+I',
				click() {

					(mainWindow as any).toggleDevTools()
				}
			}
		]
	}
}

export function makeMainMenu(mainWindow:Electron.BrowserWindow) {
	let template
	let menu

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
					Container.get(AuthActionFactory).logout()
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
		},
		/* Repos Menu */
		{
			label: 'Repos',
			submenu: [{
				label: 'Add a Repo',
				accelerator: 'CmdOrCtrl+Shift+N',
				click() {
					log.debug('Sending add new repo')
					Container.get(UIActionFactory).showAddRepoDialog()
				}
			},{
				label: 'Synchronize All',
				accelerator: 'Ctrl+S',
				click() {
					log.debug('Sending sync all repos')
					Container.get(RepoActionFactory).syncRepo(enabledRepoIdsSelector(getStoreState()),true)
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
		}, {
			label: 'View',
			submenu: [{
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
		}]

		menu = Menu.buildFromTemplate(template)

	} else {
		template = [{
			label:   '&File',
			submenu: [{
				label: 'Signout...',
				accelerator: 'Command+L',
				click() {
					Container.get(AuthActionFactory).logout()
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

		if (Env.isDev)
			template.push(makeDevMenu(mainWindow))
		menu = Menu.buildFromTemplate(template)
	}

	return menu
}