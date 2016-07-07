import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'


/**
 * Now the shared globals - this is required for propper logging config
 */
import "shared/Globals"

function logErrorGlobal(err:Error|string) {
	require('shared/Toaster').addErrorMessage(err)
}



// ERROR HANDLING
if (typeof window !== 'undefined') {
	window.onerror = function(message,url,lineno,colno,error) {
		const allErrorArgs = [...arguments]

		console.error('unhandled',allErrorArgs)
		logErrorGlobal(error || new Error(message))
	}
}

process.on("unhandledRejection", function (reason, promise) {
	console.error(`Epic Task Unhandled Exception`, reason, reason && reason.stack,promise)
	logErrorGlobal(reason instanceof Error ? reason : new Error(reason))
})

declare global {
	var CSSModules:any
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
	var Notification:any
	var logError:typeof logErrorGlobal
}

const g = global as any

Object.assign(g,{
	CSSModules: require('react-css-modules'),
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal,
	logError: logErrorGlobal
})


export {

}
