import "shared/Globals"
import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'
import {Toaster} from 'shared/Toaster'
import {Container} from 'typescript-ioc'
import {CreateGlobalThemedStyles as CreateGlobalThemedStylesGlobal} from 'shared/themes/ThemeManager'
import * as JQueryGlobal from 'jquery'
import * as Immutable from 'immutable'




/**
 * Now the shared globals - this is required for propper logging config
 */


function logErrorGlobal(err:Error|string) {
	const toaster = Container.get(Toaster)
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
	var CSSModules:any
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
	var Notification:any
	var logError:typeof logErrorGlobal
	var $:typeof JQueryGlobal
	
	interface Window {
		$:typeof JQueryGlobal
	}
}

const g = global as any

Object.assign(g,{
	CSSModules: require('react-css-modules'),
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal,
	logError: logErrorGlobal,
	$: window.$ || JQueryGlobal
})



if (Env.isDev) {
	// const installImmutableDevTools = require('immutable-devtools')
	// installImmutableDevTools(Immutable)

	_.assignGlobal({Perf:require('react-addons-perf')})


}


export {

}
