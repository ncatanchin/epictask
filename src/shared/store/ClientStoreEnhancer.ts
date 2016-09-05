
const log = getLogger(__filename)

import serverClient from "shared/server/ServerClient"
import {getReducers} from 'shared/store/Reducers'

let reducers = getReducers()

if (module.hot) {
	module.hot.accept(['./Reducers'],(updates) => {
		log.info('Reducers HMR update',updates)
		reducers = getReducers()
	})
}





function clientStoreEnhancer(storeCreator) {
	log.info(`Adding client store enhancer`)
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
		
		serverClient.addActionListener(clientActionHandler)
		if (module.hot)
			module.hot.dispose(() => serverClient.removeActionListener(clientActionHandler))
		
		return store
	}

}


export default clientStoreEnhancer

if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
	})
}

