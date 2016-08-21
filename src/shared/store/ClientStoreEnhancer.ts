
const log = getLogger(__filename)

import * as ServerClient from "shared/actions/ServerClient"
import {getReducers} from 'shared/store/Reducers'

let reducers = getReducers()

if (module.hot) {
	module.hot.accept(['./Reducers'],(updates) => {
		log.info('Reducers HMR update',updates)
		reducers = getReducers()
	})
}





function clientStoreEnhancer(storeCreator) {
	
	return (rootReducer,initialState) => {
		
		/**
		 * Create an enhanced reducer that
		 * checks the state sync status
		 * and if out of sync gets the main state
		 *
		 * @param state
		 * @param action
		 * @returns {any}
		 */
		const enhancedReducer = (state, action) => {
			return rootReducer(state, action)
		}
		
		// Create the redux store
		let store = storeCreator(enhancedReducer, initialState)
		
		
		function clientActionHandler(action) {
			setImmediate(() => store.dispatch(action))
		}
		
		ServerClient.addActionListener(clientActionHandler)
		if (module.hot)
			module.hot.dispose(() => ServerClient.removeActionListener(clientActionHandler))
		
		return store
	}

}


export default clientStoreEnhancer

if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
	})
}

