const log = getLogger(__filename)

import {Events} from 'shared/Constants'
import {getReducers} from './Reducers'
import {getModel} from 'shared/models/Registry'
//const nextTick = require('browser-next-tick')


const patcher = require('immutablepatch')
const electron = require('electron')
const {ipcRenderer} = electron

const ipcListeners = []
const addIpcListener = (channel:string,listener) => {
	ipcRenderer.on(channel,listener)
	ipcListeners.push([channel,listener])
}

let reducers = getReducers()
let receivedState = null
let lastPatchNumber = -1

if (module.hot) {
	module.hot.accept(['./Reducers'],(updates) => {
		log.info('Reducers HMR update',updates)
		reducers = getReducers()
	})
}


// Hydrate the state returned from the main process
function hydrateState(state) {
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


}

function stateReviver(key,value:any) {
	const clazzName = value.get('$$clazz')
	if (clazzName) {
		const modelClazz = getModel(clazzName)
		if (modelClazz)
			return new modelClazz(value.toJS())
	}

	const isIndexed = Immutable.Iterable.isIndexed(value);
	return isIndexed ? value.toList() : value.toMap();
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
	return (reducer) => {

		receivedState = getMainProcessState()

		const
			{remote}= electron,
			{guestInstanceId} = (process as any)

		const
			rendererId = guestInstanceId || remote.getCurrentWindow().id,
			clientId = (process as any).guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`

		ipcRenderer.send(Events.StoreRendererRegister,{clientId})

		reducer = () => {
			return receivedState
		}

		let store = storeCreator(reducer, receivedState)


		addIpcListener(Events.StoreMainStateChanged,(event,payload) => {
			const {action,patchNumber,patch:patchJS} = _.cloneDeep(payload)

			// Patch JS to apply to state
			if (!patchJS) return

			// Check if the patch numbers are in sync
			const outOfSync = (patchNumber - 1 !== lastPatchNumber)

			// Update the cached patch number
			lastPatchNumber = patchNumber

			if (outOfSync) {
				receivedState = getMainProcessState()
			} else {
				// Model registry is used to revive classes
				const patch = Immutable.fromJS(patchJS,stateReviver)

				const lastState = receivedState
				receivedState = patcher(lastState,patch)
			}


			store.dispatch(action)
		})

		store.getState = () => receivedState

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