
// Get an error logger
const getErrorLogger = () => require('typelogger').create(__filename)

if (typeof window !== 'undefined') {
	const log = getLogger(__filename)
	window.onerror = function(message,url,line) {
		log.error('Window error occurred',message,url,line)
	}
}


process.on("unhandledRejection", function (reason,promise) {
	const log = getErrorLogger()
	console.error('Unhandled rejection',reason,promise)
	log.error('Unhandled rejection',reason,promise)
})



process.on("uncaughtException", function (reason,promise) {
	const log = getErrorLogger()
	console.error('Unhandled error',reason,promise)
	log.error('Unhandled error',reason,promise)
})

// process.on("rejectionHandled", function (reason,promise) {
// 	const log = getErrorLogger()
// 	console.error('Unhandled error',reason,promise)
// 	log.error('Unhandled error',reason,promise)
// })