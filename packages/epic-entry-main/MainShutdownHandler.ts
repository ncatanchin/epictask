
import Electron from 'epic-electron'



const
	log = getLogger(__filename),
	{BrowserWindow,app} = Electron


//log.setOverrideLevel(LogLevel.DEBUG)

_.assignGlobal({
	shutdownInProgress: false
})


let
	shutdown = false,
	processesStopping = false


function isShuttingDown() {
	return shutdown || (global as any).shutdownInProgress
}

assignGlobal({isShuttingDown})


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


app.on('before-quit',shutdownApp)

// ON ALL WINDOWS CLOSED - QUIT
app.on('window-all-closed',(event) => {
	log.info(`All windows closed - quitting`)
	if (!Env.isMac)
		shutdownApp()
})

// WHEN APP IS GOING TO QUIT
app.on('will-quit',onShutdown)
