

import { isElectron,isMain } from "shared/commands/CommandManagerConfig"

let
	thisBrowserWindow:Electron.BrowserWindow = null,
	thisWindow:Window = null
	

export function getCommandBrowserWindow():Electron.BrowserWindow {
	return thisBrowserWindow ? thisBrowserWindow :
		(!isMain && isElectron) ?
			(thisBrowserWindow = require('electron').remote.getCurrentWindow()) :
			null
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
	getCommandBrowserWindow() && getCommandBrowserWindow().addListener(eventName,listener)
	
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