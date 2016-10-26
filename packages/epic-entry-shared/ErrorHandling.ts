const
	StackTrace = require('stacktrace-js')

Object.assign(global as any, {StackTrace})

// Get an error logger
let
	errorLogger = null

const
	getErrorLogger = () =>
		errorLogger ||
		(errorLogger = require('typelogger').create(__filename))

if (typeof window !== 'undefined') {
	const log = getLogger(__filename)
	window.onerror = function (message, url, line) {
		log.error('Window error occurred', message, url, line)
	}
}

/**
 * Deep trace an error
 *
 * @param reason
 */
function	deepTrace(reason) {
		const
			log = getErrorLogger()
	
		if (reason instanceof Error || reason.stack) {
			StackTrace.fromError(reason)
				.then((updatedErrorStack) => {
					try {
						log.error(
							'Deep trace for',
							reason,
							'\n',
							updatedErrorStack.map(frame => {
								if (frame.fileName && frame.fileName.startsWith('/'))
									frame.setFileName(`file://${frame.fileName}`)
								
								return `\t at ${frame.toString()}`
							}).join('\n')
						)
					} catch (err) {
						log.error(`Failed to map deep trace`,err,updatedErrorStack,reason)
					}
					// updatedErrorStack.forEach(frame => {
					// 	log.error(frame)
					// })
				})
		} else {
			StackTrace.get()
				.then(function (stack) {
					log.error('Deep Trace for Stack', reason, stack)
				})
				.catch(function (err) {
					log.error('failed to get stack', err)
				});
		}
	}

/**
 * Unhandled rejection
 *
 * @param reason
 * @param promise
 */
function unhandledRejection (reason, promise) {
	const log = getErrorLogger()
	
	//deepTrace(reason)
	//console.error('Unhandled rejection', reason)
	log.error('Unhandled rejection', reason, promise)
	
	try {
		deepTrace(reason)
	} catch (err) {
		console.error('Deep trace failed',err)
	}
	
}
	
process.on("unhandledRejection", unhandledRejection)

/**
 * Uncaught Exception
 * @param err
 */
function uncaughtException (err) {
	const log = getErrorLogger()
	console.error('Unhandled exception', err)
	log.error('Unhandled exception', err)
}

process.on("uncaughtException", uncaughtException)

/**
 * on warning
 *
 * @param warning
 */
function systemWarning(warning) {
	const log = getErrorLogger()
	log.warn('WARNING', warning)
}

process.on("warning", systemWarning)

// process.on("rejectionHandled", function (reason, promise) {
// 	const log = getErrorLogger()
//
// 	//deepTrace(reason)
//
// 	console.error('Handled rejection', reason, promise)
// 	log.error('Handled rejection', reason, promise)
// })


export {
	
}