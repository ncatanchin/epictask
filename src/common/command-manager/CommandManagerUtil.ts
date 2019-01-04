

import getLogger from "common/log/Logger"
import * as Electron from 'electron'
import {getCurrentWindow} from "common/ElectronUtil"
let
	thisWindow:Window = null
	
const
	log = getLogger(__filename)

export function getCommandBrowserWindow():Electron.BrowserWindow | null {
	
	try {
		return getCurrentWindow()
	} catch (err) {
		log.warn(`Unable to get current window`, err)
		return null
	}
}


function getWindow():Window {
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
export function addBrowserWindowListener(eventName:string,listener):void {
	try {
		getCommandBrowserWindow() && getCommandBrowserWindow().addListener(eventName as any,listener)
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
export function removeBrowserWindowListener(eventName:string,listener):void {
	getCommandBrowserWindow() && getCommandBrowserWindow().removeListener(eventName as any,listener)
}

/**
 * Add window listener
 *
 * @param eventName
 * @param listener
 */
export function addWindowListener(eventName:string,listener):void  {
	getWindow() && getWindow().addEventListener(eventName,listener)
}

/**
 * Remove window listener
 *
 * @param eventName
 * @param listener
 */
export function removeWindowListener(eventName:string,listener):void  {
	getWindow() && getWindow().removeEventListener(eventName as any,listener)
}
