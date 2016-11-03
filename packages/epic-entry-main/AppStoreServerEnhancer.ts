
import { broadcastAppStoreAction } from "./AppStoreServer"
import { getValue } from "epic-global/ObjectUtil"

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
function appStoreServerEnhancer(storeCreator) {
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
				{fromChildId} = action,
				fromRenderer = getValue(() => action.source.fromRenderer),
				newState = store.getState()
			
			// IF CHANGED - SEND TO CHILDREN
			if (!fromChildId && !fromRenderer && state !== newState) {
				nextTick(() => broadcastAppStoreAction(action))
			}
		}
		return store
	}
}

export default appStoreServerEnhancer