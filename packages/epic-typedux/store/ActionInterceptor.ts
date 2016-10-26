
import { IChildStoreSubscriptionManager } from "epic-typedux/store/ChildStore"
import { If, ProcessType } from "epic-global"
import { addActionInterceptor, IActionInterceptorNext } from "typedux"

const
	log = getLogger(__filename)

let
	interceptorInstalled = false

/**
 * Install action interceptor for child
 *
 * @param childStoreManager
 */
export function installActionInterceptor(childStoreManager:IChildStoreSubscriptionManager) {
	// MAKE SURE THE INTERCEPTOR IS INSTALLED FOR CHILD STORES
	// - INTERCEPTS ACTIONS (NOT REDUCER ACTIONS)
	// - PUSHES TO ROOT STORE
	If(!interceptorInstalled && !ProcessConfig.isType(ProcessType.UI), () => {
		
		interceptorInstalled = true
		
		const
			unregisterInterceptor = addActionInterceptor(
				({ leaf, type, options }, next:IActionInterceptorNext, ...args:any[]) => {
					
					// Push it to the server
					childStoreManager.sendAction({ leaf, type, args })
					
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
	})
}