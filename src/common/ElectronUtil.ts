import {get as _get} from 'lodash'
import getLogger from "common/log/Logger"
import {isMain} from "common/Process"
import * as Electron from "electron"
import {App} from "electron"

const
	log = getLogger(__filename)

//
// /**
//  * Find the Filesystem path to electron
//  *
//  * @returns {string}
//  */
// function getElectronPath():string {
//
// 	let electron:string = null
//
// 	try {
// 		// first try to find the electron executable if it is installed from electron-prebuilt..
// 		log.info('trying to get electron path from electron-prebuilt module..')
//
// 		// eslint-disable-next-line global-require
// 		electron = require('electron-prebuilt')
// 	} catch (err) {
// 		if (err.code === 'MODULE_NOT_FOUND') {
// 			// ..if electron-prebuilt was not used try using which module
// 			log.info('trying to get electron path from $PATH..')
// 			electron = require('which').sync('electron')
// 		} else {
// 			throw err
// 		}
// 	}
//
// 	return electron
// }
//
//
// export const ELECTRON_PATH = getElectronPath()


/**
 * In Electron runtime
 */
export function inElectron():boolean {
	try {
		const
			electron = require('electron')

		return !!electron.app || !!electron.remote.app
	} catch (err) {
		return false
	}
}



declare global {
	interface Point {
		x:number
		y:number
	}
}


export function isPointInBounds({x,y}:Point,bounds:Electron.Rectangle):boolean {
	return bounds.x <= x && bounds.x + bounds.width >= x &&
		bounds.y <= y && bounds.y + bounds.y + bounds.height >= y
}

export function isBoundsWithinBounds(bounds:Electron.Rectangle,test:Electron.Rectangle):boolean {
	const
		points = [
			{x:bounds.x,y:bounds.y},
			{x:bounds.x + bounds.width,y:bounds.y},
			{x:bounds.x + bounds.width,y:bounds.y + bounds.height},
			{x:bounds.x,y:bounds.y + bounds.height}
		]

	return points.every(p => isPointInBounds(p,test))
}



export function getDisplayForPoint(p:Point):Electron.Display {
	let
		electron = require('electron')

	electron = electron.remote as any || electron

	const
		displays = electron.screen.getAllDisplays()

	return displays.find(it => isPointInBounds(p,it.bounds))
}

/**
 * Test platform
 *
 * @param browserTest
 * @param nodeTest
 * @returns {boolean}
 */
export function testPlatform(browserTest:RegExp,nodeTest:RegExp):boolean {
	const
		navPlatform = typeof window !== 'undefined' && _get(window,'navigator.platform') as string

	if  (navPlatform)
		return browserTest.test(navPlatform.toLowerCase())

	return nodeTest.test(process.platform || '')
}


export function isMac():boolean {
	return testPlatform(/mac/,/darwin/)
}

export function isWindows():boolean {
	return testPlatform(/win/,/win32/)
}

export function isLinux():boolean {
	return testPlatform(/linux/,/linux|freebsd/)
}

/**
 * Global function for retrieving the child window id
 *
 * @returns {null}
 */
let windowId = null

export function getWindowId():number {
	if (windowId)
		return windowId

	return (windowId = !Electron.remote ? -1 : Electron.remote.getCurrentWindow().id)
}

export function getCurrentWindow():Electron.BrowserWindow {
	return isMain() ? Electron.BrowserWindow.getFocusedWindow() : Electron.remote.getCurrentWindow()
}


export function getApp():Electron.App {
	return Electron.remote ? Electron.remote.require("electron").app : Electron.app
}
