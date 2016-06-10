import ReactGlobal = require('react')
import * as ReactDOMGlobal from 'react-dom'


Object.assign(global,{
	CSSModules: require('react-css-modules'),
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal
})

/**
 * Now the shared globals - this is required for propper logging config
 */
require("shared/Globals")

declare global {
	var CSSModules:any
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
}



function onErrorReceived(err:Error) {
	const {AppActionFactory} = require('app/actions')
	const actions = new AppActionFactory()
	actions.addErrorMessage(err)
}

// ERROR HANDLING
if (typeof window !== 'undefined') {
	window.onerror = function(message,url,line) {
		console.error('unhandled',message,url,line)
		onErrorReceived(new Error(message))
	}
}

process.on("unhandledRejection", function (reason, promise) {
	// console.trace(reason)
	console.error(`Epic Task Unhandled Exception`, reason, reason && reason.stack,promise)
	onErrorReceived(reason)
})



export {

}