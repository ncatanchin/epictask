import {Events} from 'shared/Constants'
import {getReducers} from './Reducers'
const log = getLogger(__filename)

const electron = require('electron')
const {ipcRenderer} = electron

const ipcListeners = []
const addIpcListener = (channel:string,listener) => {
	ipcRenderer.on(channel,listener)
	ipcListeners.push([channel,listener])
}


let reducers = getReducers()

if (module.hot) {
	module.hot.accept(['./Reducers'],(updates) => {
		log.info('Reducers HMR update',updates)
		reducers = getReducers()
	})
}

function hydrateState(state) {


	if (!state)
		return Immutable.Map()

	const keys = (Immutable.Map.isMap(state)) ?
		state.keys() :
		Object.keys(state)


	return keys
		.reduce((finalState,key) => {
			//const reducer = reducers.find(reducer => reducer.leaf() === key)
			let val = state.get ? state.get(key) : state[key]
			// if (reducer) {
			// 	val = reducer.prepareState(val)
			// }

			return finalState.set(key,val)
		},Immutable.Map())


}




function getMainProcessState() {

	let mainState = ipcRenderer.sendSync(Events.StoreGetMainState)
	if (mainState) {
		log.debug('Got main state',Object.keys(mainState))
		mainState = hydrateState(mainState)
	}

	return mainState
}


export default function rendererStoreEnhancer(storeCreator) {
	return (reducer, initialState) => {

		initialState = getMainProcessState()

		const
			{remote}= electron,
			{guestInstanceId} = (process as any),
			rendererId = guestInstanceId || remote.getCurrentWindow().id,
			clientId = (process as any).guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`

		ipcRenderer.send(Events.StoreRendererRegister,{clientId})

		let receivedState = null
		let receivedAction = null

		reducer = (state = initialState,action) => {
			if (receivedState) {
				state = receivedState
				receivedState = null
			}

			return state
		}

		let store = storeCreator(reducer, initialState)

		addIpcListener(Events.StoreMainStateChanged,(event,{action,newState}) => {
			if (!newState)
				return


			receivedState = hydrateState(_.cloneDeep(newState))
			store.dispatch(action)
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