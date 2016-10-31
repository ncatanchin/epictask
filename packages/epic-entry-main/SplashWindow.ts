import Electron,{BrowserWindow,screen} from 'electron'
import { getSplashEntryHtmlPath } from "epic-global/TemplateUtil"

const
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
		screenSize = screen.getPrimaryDisplay().workAreaSize,
		splashDim = Math.min(screenSize.width,screenSize.height) / 3
	
	
	splashWindow = new BrowserWindow({
		center: true,
		//alwaysOnTop: true,
		transparent: true,
		width: splashDim,
		height: splashDim,
		frame: false
	})
	
	splashWindow.loadURL(splashTemplateURL)
	
	splashWindow.once('ready-to-show',() => {
		readyToShow = true
		
		splashWindow.show()
		
		!Env.isDev && splashWindow.focus()
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



