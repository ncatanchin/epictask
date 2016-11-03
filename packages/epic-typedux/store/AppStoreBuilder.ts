import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"
import { SynchronizedStateKeys } from "epic-global/Constants"

import {Map} from 'immutable'
import { loadStateFromDisk } from "epic-typedux/store/AppStorePersistence"
import { isMap } from "typeguard"
import { getModel } from "epic-global/Registry"

const
	log = getLogger(__filename)

export async function storeBuilder(enhancer = null) {
	
	const
		AppStore = require('./AppStore')
	
	let
		client,
		initialState:Map<string,any> =
			(await loadStateFromDisk()) || Map<string,any>()
	
	
	// FORCE LOAD THE STATE MODULE TO REGISTER ALL MODELS
	require('../state')
	
	// IF NOT MAIN THEN GET STATE FROM MAIN
	if (!ProcessConfig.isMain()) {
		client = require('./AppStoreClient')
		
		log.info(`Connecting to state server`)
		
		const
			leafStates = await Promise.all(
				SynchronizedStateKeys.map(key => client.getStateValue(key))
			)
		
		if (!enhancer)
			enhancer = require('./AppStoreClientEnhancer').default
		
		SynchronizedStateKeys.forEach((leaf,index) => {
			const
				clazz = getModel(leaf),
				leafState = clazz.fromJS(leafStates[index])
			
			isMap(initialState) ?
				initialState = (initialState.set(leaf,leafState) as any) :
				initialState[leaf] = leafState
		})
		
	}
	
	const
		store:ObservableStore<any> =
			await AppStore.loadAndInitStore(initialState,enhancer)
				
	
	Container
		.bind(ObservableStore)
		.provider({ get: () => store})
	
	// SET THE CLIENT AS READY AND FLUSH PENDING ACTIONS
	await Promise.setImmediate()
	
	client && client.setStoreReady(true)
	
	log.info(`Built store`)
	
	setStoreReady(true)
	
	return store
}



export default storeBuilder
