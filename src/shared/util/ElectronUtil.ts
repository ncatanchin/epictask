const
	which = require('which'),
	log = getLogger(__filename)


/**
 * Find the Filesystem path to electron
 *
 * @returns {string}
 */
function getElectronPath():string {

	let electron:string = null

	try {
		// first try to find the electron executable if it is installed from electron-prebuilt..
		log.info('trying to get electron path from electron-prebuilt module..')

		// eslint-disable-next-line global-require
		electron = require('electron-prebuilt')
	} catch (err) {
		if (err.code === 'MODULE_NOT_FOUND') {
			// ..if electron-prebuilt was not used try using which module
			log.info('trying to get electron path from $PATH..')
			electron = which.sync('electron')
		} else {
			throw err
		}
	}

	return electron
}


export const ELECTRON_PATH = getElectronPath()
