


import { sendStoreAction } from "epic-typedux/store/AppStoreClient"
import { SynchronizedStateKeys } from "epic-global/Constants"

const
	log = getLogger(__filename),
	{nextTick} = process

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function appStoreEnhancer(storeCreator) {
	return (reducer, initialState) => {
		let
			store = storeCreator(reducer, initialState)
		
		const
			storeDotDispatch = store.dispatch
		
		// OVERRIDE DISPATCH - CHECK STATE AFTER ACTION
		store.dispatch = (action) => {
			const
				{fromServer} = action,
				state = store.getState()
			
			nextTick(() => {
				storeDotDispatch(action)
				
				const
					newState = store.getState()
				
				// IF CHANGED - SEND TO CHILDREN
				if (SynchronizedStateKeys.includes(action.leaf) &&  !fromServer && state !== newState) {
					
					// If it's a reducer then process it, otherwise - wait for server
					// to process the action and send data
					nextTick(() => sendStoreAction(assign(action,{
						windowId: getWindowId()
					})))
					
				}
			})
			
			
			
		}
		return store
	}
}

export default appStoreEnhancer