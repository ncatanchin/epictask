
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
 * Force kill the app
 */
function forceKill() {

	console.log(`HARD STOP`)
	
	BrowserWindow.getAllWindows().forEach(win => {
		try {
			win.destroy()
		} catch (err) {
			log.info(`Unable to destroy window: ${win.id}`,err)
		}
	})
	
	process.exit(0)
	app.exit(0)
}

/**
 * On shutdown intercepts quit requests and makes sure
 * all children are properly shutdown/killed
 *
 * @param event
 */
function onShutdown(event) {
	
	setShuttingDown()
	
	// EMIT SHUTDOWN
	EventHub.broadcast(EventHub.Shutdown)
	
	if (!processesStopping) {
		processesStopping = true
		
		event.preventDefault()
		
		const
			killAll = async () => {
				
				log.info(`Starting window shutdown`)
				
				try {
					const
						windowManager = require("epic-process-manager/WindowManager").getWindowManager()
					
					await windowManager.shutdown()
					log.info(`All windows shutdown`)
				} catch (err) {
					log.error(`Failed to shutdown cleanly - going to force close`,err)
					
					killAll()
				}
				
				app.quit()
			}
		
		setTimeout(forceKill,5000)
		
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
						it.type !== WindowType.Tray &&
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


