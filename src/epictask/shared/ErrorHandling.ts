


if (typeof window !== 'undefined') {
	const log = getLogger(__filename)
	window.onerror = function(message,url,line) {
		log.error('Window error occured',message,url,line)
	}
}

process.on("rejectionHandled", function (reason,promise) {
	const log = getLogger(__filename)
	console.error('Unhandled error',reason,promise)
	log.error('Unhandled error',reason,promise)
})