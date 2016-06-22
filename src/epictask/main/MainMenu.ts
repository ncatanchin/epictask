const { app, BrowserWindow, Menu, shell,ipcMain,dialog } = require('electron')
const log = getLogger(__filename)


export function makeMainMenu(mainWindow) {
	let template
	let menu

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
			label: 'Repos',
			submenu: [{
				label: 'Synchronize All',
				accelerator: 'Ctrl+S',
				click() {
					log.info('Sending sync all repos')
					const {RepoActionFactory} = require('shared/actions/repo')
					new RepoActionFactory().syncAllRepoDetails()
				}
			}]
		}, {
			label: 'View',
			submenu: (Env.isDebug) ? [{
				label: 'Reload',
				accelerator: 'Command+Shift+R',
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

	} else {
		template = [{
			label:   '&File',
			submenu: [{
				label:       '&Open',
				accelerator: 'Ctrl+O'
			}, {
				label:       '&Close',
				accelerator: 'Ctrl+W',
				click() {
					mainWindow.close()
				}
			}]
		}, {
			label:   '&View',
			submenu: (process.env.NODE_ENV === 'development') ? [{
				label:       '&Reload',
				accelerator: 'Ctrl+R',
				click() {
					mainWindow.restart()
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
					mainWindow.toggleDevTools()
				}
			}] : [{
				label:       'Toggle &Full Screen',
				accelerator: 'F11',
				click() {
					mainWindow.setFullScreen(!mainWindow.isFullScreen())
				}
			}]
		}, {
			label:   'Help',
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
	}

	return menu
}