

import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'

import {CreateGlobalThemedStyles as CreateGlobalThemedStylesGlobal} from "epic-styles"
import * as JQueryGlobal from 'jquery'
import * as RadiumGlobal from 'radium'
import {NotificationCenter as NotificationCenterType} from 'epic-global'



/**
 * Now the shared globals - this is required for proper logging config
 */


function logErrorGlobal(err:Error|string) {
	
	const
		NotificationCenter = require('epic-global/NotificationCenter').default as typeof NotificationCenterType,
		toaster = Container.get(NotificationCenter)
	toaster.addErrorMessage(err)
}



// ERROR HANDLING
if (typeof window !== 'undefined') {
	const errorLog = getLogger('UnhandledErrors')
	window.onerror = (message,url,lineno,colno,error,...args) => {
		const
			allErrorArgs = [message,url,lineno,colno,error,...args]
		
		errorLog.error('unhandled',...allErrorArgs)
		console.error('unhandled',...allErrorArgs)
		
		logErrorGlobal(error || new Error(message))
	}
}

process.on("unhandledRejection", function (reason, promise) {
	console.error(`Epic Task Unhandled Exception`, reason, reason && reason.stack,promise)
	logErrorGlobal(reason instanceof Error ? reason : new Error(reason))
})


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
