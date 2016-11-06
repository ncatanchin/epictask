
import Electron from 'epic-electron'


const
	log = getLogger(__filename),
	{BrowserWindow,app} = Electron


let
	shutdown = false,
	processesStopping = false


function isShuttingDown() {
	return shutdown
}

assignGlobal({isShuttingDown})


/**
 * Global shutdown function
 */
export function shutdownApp() {
	log.debug(`Received quit request, current quit started=${shutdown}`)
	if (!shutdown) {
		log.debug(`Quitting/Shutting down`)
		shutdown = true
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
	
	
	if (!processesStopping) {
		processesStopping = true
		
		event.preventDefault()
		
		const
			killAll = () => {
				// try {
				// 	windowManager.closeAll()
				// } catch (err) {
				// 	log.warn(`Failed to cleanly shutdown processes`)
				// }
				
				BrowserWindow.getAllWindows().forEach(win => {
					try {
						win.isClosable() && window.close()
					} catch (err) {
						log.warn(`Failed to destroy window`,err)
					}
				})
				
				app.exit(0)
				
			}
		
		killAll()
	}
}


// ON ALL WINDOWS CLOSED - QUIT
app.on('window-all-closed',(event) => {
	log.debug(`All windows closed - quitting`)
	if (!Env.isMac)
		shutdownApp()
})

// WHEN APP IS GOING TO QUIT
app.on('will-quit',onShutdown)
