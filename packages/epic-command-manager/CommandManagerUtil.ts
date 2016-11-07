

import { isElectron,isMain } from  "./CommandManagerConfig"

let
	thisWindow:Window = null
	
const
	log = getLogger(__filename)

export function getCommandBrowserWindow():Electron.BrowserWindow {
	
	try {
		return getCurrentWindow()
	} catch (err) {
		log.warn(`Unable to get current window`, err)
	}
}


function getWindow() {
	return thisWindow ?
		thisWindow :
		(typeof window !== 'undefined') ?
			(thisWindow = window) :
			null
}

/**
 * Add a listener to the current browser window
 *
 * @param eventName
 * @param listener
 */
export function addBrowserWindowListener(eventName:string,listener) {
	try {
		getCommandBrowserWindow() && getCommandBrowserWindow().addListener(eventName,listener)
	} catch (err) {
		log.error(`Unable to add event listener`,eventName,err)
	}
	
}

/**
 * Remove browser window listener
 *
 * @param eventName
 * @param listener
 */
export function removeBrowserWindowListener(eventName:string,listener) {
	getCommandBrowserWindow() && getCommandBrowserWindow().removeListener(eventName,listener)
}

/**
 * Add window listener
 *
 * @param eventName
 * @param listener
 */
export function addWindowListener(eventName:string,listener)  {
	getWindow() && getWindow().addEventListener(eventName,listener)
}

/**
 * Remove window listener
 *
 * @param eventName
 * @param listener
 */
export function removeWindowListener(eventName:string,listener)  {
	getWindow() && getWindow().removeEventListener(eventName,listener)
}