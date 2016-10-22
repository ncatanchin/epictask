

import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'
import {Toaster as ToasterType} from 'shared/Toaster'
import {CreateGlobalThemedStyles as CreateGlobalThemedStylesGlobal} from 'shared/themes/styles'
import * as JQueryGlobal from 'jquery'
import * as RadiumGlobal from 'radium'


/**
 * Now the shared globals - this is required for proper logging config
 */


function logErrorGlobal(err:Error|string) {
	
	const
		Toaster = require('shared/Toaster').default as typeof ToasterType,
		toaster = Container.get(Toaster)
	toaster.addErrorMessage(err)
}



// ERROR HANDLING
if (typeof window !== 'undefined') {
	const errorLog = getLogger('UnhandledErrors')
	window.onerror = function(message,url,lineno,colno,error) {
		const allErrorArgs = [...arguments]
		errorLog.error('unhandled',allErrorArgs)
		console.error('unhandled',allErrorArgs)
		logErrorGlobal(error || new Error(message))
	}
}

process.on("unhandledRejection", function (reason, promise) {
	console.error(`Epic Task Unhandled Exception`, reason, reason && reason.stack,promise)
	logErrorGlobal(reason instanceof Error ? reason : new Error(reason))
})


declare global {
	var CreateGlobalThemedStyles:typeof CreateGlobalThemedStylesGlobal
	
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
	var Notification:any
	var logError:typeof logErrorGlobal
	var $:typeof JQueryGlobal
	var Radium:typeof RadiumGlobal
	
	interface Window {
		$:typeof JQueryGlobal
		dialogName:string
	}
}

const g = global as any


assignGlobal({
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal,
	logError: logErrorGlobal,
	$: window.$ || JQueryGlobal,
	Radium:RadiumGlobal
})



if (Env.isDev) {
	// const installImmutableDevTools = require('immutable-devtools')
	// installImmutableDevTools(Immutable)

	_.assignGlobal({Perf:require('react-addons-perf')})


}


export {

}
