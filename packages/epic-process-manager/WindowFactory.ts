import Electron from 'epic-electron'
import { guard, cloneObject, getAppEntryHtmlPath, makeAppEntryURL } from "epic-global"
import { WindowEvents } from "epic-entry-shared/WindowTypes"

const
	{ BrowserWindow,ipcMain } = Electron,
	
	WindowCreateTimeout = 25000

/**
 * Created by jglanz on 12/5/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Destroy window
 *
 * @param window
 */
function destroyWindow(window: Electron.BrowserWindow) {
	const
		deferred = Promise.defer()
	
	try {
		if (!window.isDestroyed()) {
			window.once('closed', () => {
				log.debug(`Received closed event, completing destroy promise`)
				deferred.resolve()
			})
			
			window.close()
		} else {
			log.debug(`Window is already destroyed`)
			deferred.resolve()
		}
	} catch (err) {
		log.error(`Failed to close window`, err)
		deferred.resolve(err)
	}
	return deferred.promise
}

/**
 * Close a window returning a promise
 *
 * @param window
 */
function closeWindow(window: Electron.BrowserWindow) {
	const
		deferred = Promise.defer()
	
	try {
		if (window.isClosable()) {
			window.once('close', () => {
				log.debug(`Received close event, completing promise`)
				deferred.resolve()
			})
			
			window.close()
		} else {
			log.debug(`Window is not closable`)
			deferred.resolve()
		}
	} catch (err) {
		log.error(`Failed to close window`, err)
		deferred.resolve(err)
	}
	return deferred.promise
}

/**
 * WindowFactory
 *
 * @class WindowFactory
 * @constructor
 **/
class WindowFactory {
	
	/**
	 * Create a new window factory with props
	 *
	 * @param id
	 * @param processType
	 * @param opts
	 */
	constructor(public id: string,public processType:ProcessType, public opts: Electron.BrowserWindowOptions) {
		
	}
	
	/**
	 * Get the factory id/name
	 *
	 * @returns {string}
	 */
	get name() {
		return this.id
	}
	
	/**
	 * Create a window instance
	 *
	 * @returns {null}
	 */
	async create(): Promise<Electron.BrowserWindow> {
		let
			newWindowId:string  = '-1'
		
		const
			deferred = Promise.defer(),
			listener = (event,fromWindowId) => {
				log.debug(`Received window loaded (${fromWindowId}), waiting for (${newWindowId})`)
				
				if (fromWindowId === newWindowId) {
					log.debug(`Window is ready ${newWindowId}`)
					deferred.resolve()
				}
			}
		
		// START LISTENING IMMEDIATELY
		ipcMain.on(WindowEvents.AllResourcesLoaded,listener)
			
		let
			newWindow:Electron.BrowserWindow
		
		
		
		try {
			newWindow = new Electron.BrowserWindow(cloneObject(this.opts))
			newWindowId = `${newWindow.id}`
			
			const
				url = makeAppEntryURL('empty', {
					EPIC_ENTRY: ProcessType[this.processType]
				})
			
			// LOAD THE EMPTY URL OR PROCESS TYPE SPECIFIC URL
			newWindow.loadURL(url)
			//newWindow.show()
			
			
			await deferred.promise.timeout(WindowCreateTimeout)
		} catch (err) {
			log.error(`Unable to create browser window for pool`, err)
			
			if (newWindow && !newWindow.isDestroyed())
				guard(() => newWindow.destroy())
			
			throw err
		} finally {
			ipcMain.removeListener(WindowEvents.AllResourcesLoaded,listener)
		}
		
		return newWindow
	}
	
	/**
	 * Destroy a window
	 *
	 * @param window
	 * @returns {null}
	 */
	async destroy(window: Electron.BrowserWindow): Promise<void> {
		try {
			
			await closeWindow(window)
			await destroyWindow(window)
			
		} catch (err) {
			log.warn(`Unable to close window, probably destroyed`, err)
		}
		
	}
	
	/**
	 * Validate a window
	 *
	 * @param window
	 * @returns {boolean}
	 */
	async validate(window: Electron.BrowserWindow): Promise<boolean> {
		const
			isAvailable = window.isClosable() && !window.isDestroyed()
		
		return isAvailable
	}
	
}

export default WindowFactory