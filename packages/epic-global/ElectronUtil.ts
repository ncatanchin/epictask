import * as _get from 'lodash/get'

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


/**
 * Test platform
 *
 * @param browserTest
 * @param nodeTest
 * @returns {boolean}
 */
export function testPlatform(browserTest:RegExp,nodeTest:RegExp) {
	const
		navPlatform = typeof window !== 'undefined' && _get(window,'navigator.platform') as string
	
	if  (navPlatform)
		return browserTest.test(navPlatform.toLowerCase())
	
	return nodeTest.test(process.platform || '')
}


export function isMac() {
	return testPlatform(/mac/,/darwin/)
}

export function isWindows() {
	return testPlatform(/win/,/win32/)
}

export function isLinux() {
	return testPlatform(/linux/,/linux|freebsd/)
}

