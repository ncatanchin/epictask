import {RootState} from 'shared/store/RootState'
const log = getLogger(__filename)

import {Events} from '../Constants'
import {getReducers} from 'shared/store/Reducers'
import {getModel} from 'shared/Registry'
const nextTick = require('browser-next-tick')


const patcher = require('immutablepatch')
const electron = require('electron')
const {ipcRenderer} = electron

const ipcListeners = []
const patches = []
const addIpcListener = (channel:string,listener) => {
	ipcRenderer.on(channel,listener)
	ipcListeners.push([channel,listener])
}

let reducers = getReducers()
let mainState = null
let lastActionId = -1
let outOfSync = false

if (module.hot) {
	module.hot.accept(['./Reducers'],(updates) => {
		log.info('Reducers HMR update',updates)
		reducers = getReducers()
	})
}


// Hydrate the state returned from the main process
function hydrateState(state) {
	//return RootState.fromJS(state)
	const mappedState = Object
		.keys(state)
		.reduce((tempState,nextKey) => {
			const modelClazz = getModel(nextKey)
			const value = state[nextKey]
			tempState[nextKey] = modelClazz ?
				modelClazz.fromJS(value) :
				value
			return tempState
		},{})


	//console.log('Revived state from main',state,revivedState,mappedState)
	return Immutable.Map(mappedState)
	//return new RootState(mappedState)


}


function getMainProcessState() {

	let mainState = ipcRenderer.sendSync(Events.StoreGetMainState)
	if (mainState) {
		log.debug('Got main state',Object.keys(mainState))
		mainState = hydrateState(mainState)
	}

	return mainState
}



function rendererStoreEnhancer(storeCreator) {
	return (rootReducer) => {

		mainState = getMainProcessState()

		const
			{remote}= electron,
			{guestInstanceId} = (process as any)

		const
			rendererId = guestInstanceId || remote.getCurrentWindow().id,
			clientId = (process as any).guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`

		ipcRenderer.send(Events.StoreRendererRegister,{clientId})

		/**
		 * Sync the current state with the
		 * main process
		 *
		 * @returns {any}
		 */
		const syncMainState = () => {
			outOfSync = false
			return (mainState = getMainProcessState())
		}

		/**
		 * Create an enahnced reducer that
		 * checks the state sync status
		 * and if out of sync gets the main state
		 *
		 * @param state
		 * @param action
		 * @returns {any}
		 */
		const enhancedReducer = (state,action) => {
			return outOfSync ? syncMainState() : rootReducer(state,action)

		}

		// Create the redux store
		let store = storeCreator(enhancedReducer, mainState)


		addIpcListener(Events.StoreMainStateChanged,(event,payload) => {
			const {action,actionId} = _.cloneDeep(payload)

			// Patch JS to apply to state
			if (!action) return

			// Check if the patch numbers are in sync
			outOfSync = (actionId - 1 !== lastActionId)

			// Update the cached patch number
			lastActionId = actionId

			nextTick(() => store.dispatch(action))

		})

		return store
	}

}

if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
		ipcListeners.forEach(([channel,listener]) => {
			ipcRenderer.removeListener(channel,listener)
		})
	})
}

export default rendererStoreEnhancer