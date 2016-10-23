
import { broadcastAppStoreAction } from "shared/store/AppStoreServer"

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
				state = store.getState()
			
			storeDotDispatch(action)
			
			const
				newState = store.getState()
			
			// IF CHANGED - SEND TO CHILDREN
			if (state !== newState) {
				nextTick(() => broadcastAppStoreAction(action))
			}
			
		}
		
		return store
	}
	
}

export default appStoreEnhancer