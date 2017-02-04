import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"
import { SynchronizedStateKeys } from "epic-global/Constants"

import {Map} from 'immutable'
import { loadStateFromDisk } from "epic-typedux/store/AppStorePersistence"
import { isMap, isFunction } from "typeguard"
import { If } from "epic-global"

const
	log = getLogger(__filename)

export async function storeBuilder(enhancer = null) {
	
	const
		AppStore = require('./AppStore')
	
	log.debug(`Loading Action Factories`)
	loadActionFactories()
	
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
				clazz = Scopes.Models.getModel(leaf),
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

/**
 * Internal leaf to action factory class map
 */
const actionFactoryClazzMap = {} as any

/**
 * Load all the action factories
 */
export function loadActionFactories() {
	
	const
		allActions = require('epic-typedux/actions/index')
	
	Object.keys(allActions)
		.filter(modName => modName.endsWith('ActionFactory'))
		.forEach(modName => {
			
			const
				mod = allActions[modName],
				actionFactoryClazz = (isFunction(mod) ? mod : mod.default)
			
			
			if (!actionFactoryClazz) {
				return log.debug(`Unable to get action clazz from ${modName}`)
			}
			
			const
				{leaf,name,ServiceName} = actionFactoryClazz
			
			actionFactoryClazzMap[leaf] = actionFactoryClazz
			
			const actionFactoryProvider = () => {
				return Registry.Service[ServiceName] || Registry.Service[name]
			}
			
			
			Container
				.bind(actionFactoryClazz)
				.provider({
					get: actionFactoryProvider
				})
		})
	
	// IN DEBUG EXPOSE ALL PROVIDERS
	If(DEBUG,() => {
		assignGlobal(exports)
	})
	
	
	if (module.hot) {
		module.hot.accept(['epic-typedux/actions/index'], (updates) => {
			log.info(`HMR update action factories`,updates)
			loadActionFactories()
		})
	}
}

export default storeBuilder
