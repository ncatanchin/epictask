
export default function checkSingleInstance(app,onFocus) {
	const
		log = getLogger(__filename),
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
