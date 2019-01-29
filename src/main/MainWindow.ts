import * as windowStateKeeper from "electron-window-state"
import {BrowserWindow} from "electron"
import getLogger from "../common/log/Logger"
import * as _ from 'lodash'
import {isAuthenticated} from "./Auth"

const log = getLogger(__filename)

let mainWindow:BrowserWindow | null = null

const
	WindowMinWidth = 1000,
	WindowMinHeight = 650


async function installDevTools():Promise<void> {
	if (!isDev) return

	const {
		default: installExtension,
		REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS
	} = require('electron-devtools-installer')

	await Promise.all([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS].map((key:string) => {
		installExtension(key).then((name) => {
			log.info(`Added Extension:  ${name}`)
		}).catch((err) => console.log('An error occurred: ', err))
	}))
}

export async function createMainWindow():Promise<BrowserWindow> {
	if (mainWindow)
		return mainWindow

	const
		wdsPort = process.env.ELECTRON_WEBPACK_WDS_PORT,
		indexFile = `${__dirname}/index.html`,
		url = (wdsPort)
			? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
			: `file://${indexFile}`

	console.log(`Using URL: ${url}`)

	const winState = windowStateKeeper({
		defaultWidth: WindowMinWidth,
		defaultHeight: WindowMinHeight,
	})

	mainWindow = new BrowserWindow({
		webPreferences: {webSecurity: true},
		minHeight: WindowMinHeight,
		minWidth: WindowMinWidth,
		frame: false,
		... _.pick(winState, 'x', 'y', 'width', 'height'),
	})

	// if the render process crashes, reload the window
	mainWindow.webContents.on('crashed', (event, killed) => {
		console.error("CRASH", event, killed)
	})

	winState.manage(mainWindow)


	await installDevTools()


	mainWindow.on("close", () => {
		mainWindow = null
	})

	mainWindow.on("ready-to-show", () => {
		log.info("Ready to show")
		mainWindow.setTitle("Epictask")

		if (isAuthenticated())
			mainWindow.show()
		else
			mainWindow.hide()
	})

	if (isDev) {
		mainWindow.webContents.openDevTools()
	}

	log.info("Loading URL and returning")
	mainWindow.loadURL(url)

	return mainWindow
}
