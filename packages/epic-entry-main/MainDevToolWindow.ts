
const {app,BrowserWindow} = require('electron')


import * as path from 'path'

const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-devtools-entry.html')
const windowStateKeeper = require('electron-window-state')

let devWindowState = windowStateKeeper({
	defaultWidth: 800,
	defaultHeight: 600,
	file: 'dev-tool-window-state.json'
})

const window = new BrowserWindow(Object.assign({}, devWindowState, {
	show: true,
	frame: true,
	title: 'epictask-dev-tools',
	// darkTheme:true,
}))

devWindowState.manage(window)

window.webContents.openDevTools()
window.loadURL(templateURL)

export { window }
