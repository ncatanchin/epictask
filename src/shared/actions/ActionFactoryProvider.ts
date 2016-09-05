import {addActionInterceptor, IActionInterceptorNext} from 'typedux'
import {getServerClient} from "shared/server/ServerClient"


const log = getLogger(__filename)

let actionCtx = null


// If renderer then add an action interceptor
if (!ProcessConfig.isStorybook() && !ProcessConfig.isStateServer()) {
	
	// Setting up action interceptor
	const unregisterInterceptor = addActionInterceptor(
		({leaf,type,options}, next:IActionInterceptorNext, ...args:any[]) => {
			
			log.info(`${ProcessConfig.getTypeName()} Action Intercepting and forwarding ${type}`)
			// Push it to the server
			getServerClient().sendAction(leaf,type,...args)
			
			// If it's a reducer then process it, otherwise - wait for server
			// to process the action and send data
			return (options && options.isReducer) ? next() : null
		}
	)
	
	if (module.hot) {
		module.hot.dispose(() => {
			log.info(`HMR Removing action interceptor`)
			unregisterInterceptor()
		})
	}
}

/**
 * Load all the action factories
 */
export function loadActionFactories() {
	actionCtx = require.context('shared/actions/', true, /ActionFactory/)
	log.info(`Loaded Action Factories`,actionCtx.keys())
	
	actionCtx.keys().forEach(actionCtx)
}