import Electron,{BrowserWindow,screen,ipcMain} from 'electron'
import { getSplashEntryHtmlPath } from "epic-global/TemplateUtil"
import { createDevWindowMenu } from "epic-entry-main/MainMenu"

const
	log = getLogger(__filename),
	splashTemplateURL = 'file://' + getSplashEntryHtmlPath()

let
	splashWindow:Electron.BrowserWindow,
	readyToShow = false,
	showWhenReady = true

/**
 * Load the splash window
 */
function loadSplashWindow() {
	if (splashWindow)
		return splashWindow
	
	const
		primaryScreen = screen.getPrimaryDisplay(),
		screenSize = primaryScreen.workAreaSize,
		splashDim = Math.floor(Math.min(screenSize.width,screenSize.height) / 3)
	
	
	splashWindow = new BrowserWindow({
		//center: true,
		//alwaysOnTop: true,
		backgroundColor: "#212124",
		show:false,
		transparent: true,
		width: splashDim,
		height: splashDim,
		frame: false
	})
	
	splashWindow.loadURL(splashTemplateURL)
	
	// if (!Env.isMac && DEBUG) {
	// 	splashWindow.setMenu(createDevWindowMenu())
	// }
	
	ipcMain.once('splash-loaded',(event,width,height) => {
		log.debug(`Splash Image size`,width,height,splashDim)
		
		let
			maxDim = Math.max(width,height),
			minDim = Math.min(width,height),
			scale = splashDim / maxDim
			
		minDim = Math.floor(scale * minDim)
		
		if (width > height) {
			width = splashDim
			height = minDim
		} else {
			width = minDim
			height = splashDim
		}
		
		const
			bounds = {
				width: Math.floor(width),
				height: Math.floor(height),
				x: Math.floor((screenSize.width - width) / 2)+ primaryScreen.bounds.x,
				y: Math.floor((screenSize.height - height) / 2) + primaryScreen.bounds.y
			}
		
		readyToShow = true
		
		splashWindow.setBounds(bounds)
		splashWindow.show()
		!Env.isDev && splashWindow.focus()
		
	})
	
	splashWindow.once('ready-to-show',() => {
		log.debug(`Ready to show`)
	})
	
	return splashWindow
}

/**
 * Show the splash window
 */
export function showSplashWindow() {
	loadSplashWindow()
	showWhenReady = true
	
	if (!readyToShow || splashWindow.isVisible())
		return
	
	splashWindow.show()
}


/**
 * Hide the splash window
 */
export function hideSplashWindow() {
	showWhenReady = false
	
	if (!splashWindow || !splashWindow.isVisible())
		return
	
	splashWindow.hide()
}



