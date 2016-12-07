
import Electron from 'epic-electron'



const
	log = getLogger(__filename),
	{BrowserWindow,app} = Electron


//log.setOverrideLevel(LogLevel.DEBUG)


let
	shutdown = false,
	processesStopping = false


/**
 * Check if a shutdown is in progress
 *
 * @returns {boolean}
 */
function isShuttingDown() {
	return shutdown || (global as any).shutdownInProgress
}

/**
 * Expose public shutdown helpers
 */
assignGlobal({
	shutdownInProgress: false,
	isShuttingDown
})

/**
 * Mark everything as shutting down
 */
function setShuttingDown() {
	assignGlobal({
		shutdownInProgress: true
	})
	shutdown = true
}


/**
 * Global shutdown function
 */
export function shutdownApp() {
	log.debug(`Received quit request, current quit started=${shutdown}`)
	
	
	if (!shutdown) {
		setShuttingDown()
		
		log.debug(`Quitting/Shutting down`)
		app.quit()
	}
}



/**
 * Possibly use this as a point to attach to the main window
 *
 * @param mainWindow
 */
export function setupShutdownOnWindowClose(mainWindow:Electron.BrowserWindow) {
	mainWindow.on('close',shutdownApp)
}



/**
 * On shutdown intercepts quit requests and makes sure
 * all children are properly shutdown/killed
 *
 * @param event
 */
function onShutdown(event) {
	
	setShuttingDown()
	
	if (!processesStopping) {
		processesStopping = true
		
		event.preventDefault()
		
		const
			killAll = async () => {
				// try {
				// 	windowManager.closeAll()
				// } catch (err) {
				// 	log.warn(`Failed to cleanly shutdown processes`)
				// }
				
				log.info(`Starting window shutdown`)
				
				try {
					const
						windowManager = require("epic-process-manager/WindowManager").getWindowManager()
					
					await windowManager.shutdown()
					log.info(`All windows shutdown`)
				} catch (err) {
					log.error(`Failed to shutdown cleanly - going to force close`,err)
					
					BrowserWindow.getAllWindows().forEach(win => {
						try {
							win.isClosable() && win.close()
						} catch (err) {
							log.warn(`Failed to destroy window`,err)
						}
					})
				}
				
				app.quit()
				setTimeout(() => {
					console.log(`Hard stop`)
					app.exit(0)
					process.exit(0)
				},10000)
				
				
			}
		
		killAll()
	}
}

/**
 * Before quit, begin a standard shutdown
 * to preserve state etc
 */
app.on('before-quit',shutdownApp)

/**
 * Same as before, except immediate
 */
app.on('will-quit',onShutdown)

/**
 * On create add a close listener
 * so we can always check UI windows when
 * a window closes
 */
app.on('browser-window-created',(event,window) => {
	window.on('close', () => {
		try {
			if (shutdown)
				return
			
			const
				hasUIWindows = getWindowManager()
					.getWindowInstances().some(it =>
						it.type !== WindowType.Background &&
						it.running &&
						it.window !== window)
			
			if (!hasUIWindows) {
				log.info(`No more UI windows, shutting down`)
				shutdownApp()
			}
		} catch (err) {
			log.error(`Unable to check for running UI windows`,err)
		}
	})
})


/**
 * On all windows closed, shut it down
 */
app.on('window-all-closed',(event) => {
	log.info(`All windows closed - quitting`)
	if (!shutdown)
		shutdownApp()
})


