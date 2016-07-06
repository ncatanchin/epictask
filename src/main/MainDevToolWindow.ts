
const {app,BrowserWindow} = require('electron')

import windowStateKeeper = require('electron-window-state')
import {makeMainDevToolsTemplate} from './MainTemplates'

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

//window.webContents.openDevTools()
window.loadURL(makeMainDevToolsTemplate())

export { window }