
const
	{app,BrowserWindow} = require('electron')

function checkSingleInstance(app,onFocus) {
	//noinspection UnnecessaryLocalVariableJS
	const
		log = console,
		shouldQuit = app.makeSingleInstance(onFocus)
	
	/**
	 * Bind events
	 */
	if (shouldQuit) {
		log.warn('*** Another instance is running, we will exit')
		app.quit()
		return false
	}
	
	return true
	
}

checkSingleInstance(app,(event) => {
	// APP FOCUS EVENT - LIKELY SOME TRYING TO START SECOND INSTANCE
	const
		allWindows = BrowserWindow.getAllWindows(),
		win = allWindows && allWindows[ 0 ]
	
	if (win) {
		win && win.isMinimized() && win.restore()
		win.focus()
	}
})

export {}
