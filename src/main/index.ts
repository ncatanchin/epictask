import {app, BrowserWindow, globalShortcut, session} from "electron"

import createMenu from "./Menu"
import * as Auth from "./Auth"
import getLogger from "../common/log/Logger"
import {createMainWindow} from "./MainWindow"
import EventHub from "../common/events/Event"
import {isDarwin} from "common/Process"


const log = getLogger(__filename)




// DISABLE WEB-SECURITY
app.commandLine.appendSwitch('disable-web-security')

async function checkAuthenticated():Promise<void> {
	log.info(`Checking authentication: ${Auth.isAuthenticated()}`)
	if (Auth.isAuthenticated()) {
		log.info("Showing main")
		;(await createMainWindow()).show()
	} else {
		Auth.authenticate()
	}
}

EventHub.on("ConfigChanged",checkAuthenticated)
EventHub.on("AuthComplete",checkAuthenticated)

// Quit application when all windows are closed
app.on('window-all-closed', () => {
	if (isDarwin()) {
		app.quit()
	}
})

app.on('activate', async () => {
	// On macOS it is common to re-create a window
	// even after all windows have been closed
	await createMainWindow()
})

// Create main BrowserWindow when electron is ready
app.on('ready', async () => {
	require('electron-context-menu')()
	Auth.register()
	createMenu()
	await createMainWindow()
	await checkAuthenticated()
	
	registerShortcuts()
	app.on("browser-window-focus", registerShortcuts)
	app.on("browser-window-blur", unregisterShortcuts)
})

const Shortcuts = [
	{
		accelerator: 'CommandOrControl+Option+I',
		handler() {
			BrowserWindow.getAllWindows().forEach(it => it.webContents.toggleDevTools())
		}
	}
]



function registerShortcuts():void {
	Shortcuts.forEach(config => {
		globalShortcut.register(config.accelerator,config.handler)
	})
	
}

function unregisterShortcuts():void {
	Shortcuts.forEach(config => {
		globalShortcut.unregister(config.accelerator)
	})
}
