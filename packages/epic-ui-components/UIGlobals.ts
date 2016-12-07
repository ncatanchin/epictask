

/**
 * Now the shared globals - this is required for proper logging config
 */

let
	errorLogger = null

function getErrorLogger() {
	return errorLogger || (errorLogger = getLogger('UnhandledErrors'))
}

/**
 * Log error globally
 *
 * @param err
 */
function logErrorGlobal(err:Error|string) {
	getNotificationCenter().notifyError(err)
}



// ERROR HANDLING
if (typeof window !== 'undefined') {
	const
		errorLog = getErrorLogger()
	window.onerror = (message,url,lineno,colno,error,...args) => {
		const
			allErrorArgs = [message,url,lineno,colno,error,...args]
		
		errorLog.error('unhandled',...allErrorArgs)
		console.error('unhandled',...allErrorArgs)
		
		logErrorGlobal(error || new Error(message))
	}
}


/**
 * On warning or unhandled rejection
 *
 * @param reason
 * @param promise
 */
function onWarning(reason, promise) {
	console.error(`Epic Task Unhandled Exception`, reason, reason && reason.stack,promise)
	logErrorGlobal(reason instanceof Error ? reason : new Error(reason))
}

process.on("unhandledRejection", onWarning)


assignGlobal({
	logError: logErrorGlobal
})




export {

}
