
const {app,BrowserWindow} = require('electron')

import windowStateKeeper = require('electron-window-state')
import * as path from 'path'

const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-devtools-entry.html')


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
