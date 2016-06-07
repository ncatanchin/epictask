const log = getLogger(__filename)

if (typeof window !== 'undefined') {
	window.onerror = function(message,url,line) {
		log.error('Window error occured',message,url,line)
	}
}

process.on("rejectionHandled", function (reason,promise) {
	console.error('Unhandled error',reason,promise)
	log.error('Unhandled error',reason,promise)
})