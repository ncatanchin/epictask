import {Events} from 'shared/Constants'
import {getReducers} from './Reducers'
import {getModel} from 'shared/models/Registry'

const nextTick = require('browser-next-tick')
const log = getLogger(__filename)

const patcher = require('immutablepatch')
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


	const revivedState = Immutable.Map(mappedState)

	console.log('Revived state from main',state,revivedState,mappedState)
	return revivedState


}




function getMainProcessState() {

	let mainState = ipcRenderer.sendSync(Events.StoreGetMainState)
	if (mainState) {
		log.debug('Got main state',Object.keys(mainState))
		mainState = hydrateState(mainState)
	}

	return mainState
}


let receivedState = null


export default function rendererStoreEnhancer(storeCreator) {
	return (reducer) => {

		receivedState = getMainProcessState()

		const
			{remote}= electron,
			{guestInstanceId} = (process as any),
			rendererId = guestInstanceId || remote.getCurrentWindow().id,
			clientId = (process as any).guestInstanceId ? `webview ${rendererId}` : `window ${rendererId}`

		ipcRenderer.send(Events.StoreRendererRegister,{clientId})

		reducer = () => {
			return receivedState
		}

		let store = storeCreator(reducer, receivedState)

		addIpcListener(Events.StoreMainStateChanged,(event,{action,patch:patchJS}) => {
			if (!patchJS)
				return

			// Model registry is used to revive classes
			const patch = Immutable.fromJS(patchJS,(key,value:any) => {
				const clazzName = value.get('$$clazz')
				if (clazzName) {
					const modelClazz = getModel(clazzName)
					if (modelClazz)
						return new modelClazz(value.toJS())
				}

				const isIndexed = Immutable.Iterable.isIndexed(value);
				return isIndexed ? value.toList() : value.toMap();
			})
			// const patch = Immutable.List(patchJS)
			// 	.map(patchItem => Immutable.Map(patchItem))

			const lastState = receivedState
			receivedState = patcher(lastState,patch)

			console.log('received state patch',receivedState,'path',patch,'last state',lastState)
			store.dispatch(action)
			//dispatchLater(store,action)
			// nextTick(() => {
			//
			// })
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