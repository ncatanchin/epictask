import {
	OnlyIfFn,
	writeFile, getHot, getUserDataFilename, writeFileAsync
} from "epic-global"

import { IFilterConfig, fromPlainObject, toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { readFileAsync } from "epic-global/Files"
import { AppKey, JobKey } from "epic-global/Constants"
import {Map} from 'immutable'
import { isMap } from "typeguard"

const
	log = getLogger(__filename),
	stateFilename = getUserDataFilename(`epictask-store-state-${getProcessId()}.json`)

let
	persistingState = false,
	getStoreState = null


/**
 * Main filter can store everything it has
 *
 * @type {IFilterConfig}
 */
const MainFilterConfig = excludeFilterConfig()

/**
 * Clients do not persist AppState or JobState
 *
 * @type {IFilterConfig}
 */
const ClientFilterConfig = excludeFilterConfig(
	...excludeFilter(AppKey,JobKey)
)

/**
 * Serialize the current state as a string
 *
 * @returns {string}
 */
export function serializeState(state = null, filter:IFilterConfig = null) {
	if (!state)
		state = (getStoreState && getStoreState()) || {}
	
	const
		filterConfig = Env.isMain ? MainFilterConfig : ClientFilterConfig,
		leafs = isMap(state) ?
			state.keySeq().toArray() :
			Object.keys(state),
		
	
	
		plainObject = toPlainObject(
			leafs.reduce((cleanState,leaf) => {
				const
					leafState = state.get ? state.get(leaf) : state[leaf]
				
				cleanState[leaf] = leafState.toJS ?
					leafState.toJS() :
					leafState
				
				return cleanState
			},{}),
			filterConfig
		)
	
	return JSON.stringify(plainObject)
}


/**
 * Configure the stores persistence
 *
 * @param store
 * @param getStoreStateIn
 */
export function configureStorePersistence(store,getStoreStateIn) {
	assert(_.isFunction(getStoreStateIn), "Get store state must be a function")
	
	getStoreState = getStoreStateIn
	
	
	
	/**
	 * onChange event of store
	 */
	function onChange() {
		log.debug(`Store state changed`)
		persistStoreState()
	}
	
	
	
	/**
	 * Write the actual state async
	 */
	function writeStoreState(doAsync = false) {
		const
			state = (getStoreState && getStoreState()) || {}
		
		log.info(`Writing current state to: ${stateFilename}`)
		if (persistingState) {
			log.info('Persisting, can not persist until completion')
			return
		}
		
		persistingState = true
		
		const
			serializedState = serializeState(state)
		
		if (doAsync)
			return Promise
				.resolve(writeFileAsync(stateFilename, serializedState))
				.catch(err => {
					log.error('state persistence failed', err)
				})
				.finally(() => persistingState = false)
		
		try {
			writeFile(stateFilename, serializedState)
		} catch (err) {
			log.error(`Failed to persist store state`, err)
		}
		persistingState = false
		return Promise.resolve()
	}
	
	/**
	 * Is persistence allowed
	 * @returns {any|boolean}
	 */
	function canPersistState() {
		// const
		// 	canPersist = ProcessConfig.isType(ProcessType.UI)
		//
		// if (!canPersist)
		// 	log.debug(`Can not persist state in process=${ProcessConfig.getTypeName()}`)
		//
		//return canPersist
		return true
		
	}
	
	/**
	 * Debounced persist store state call
	 */
	const persistStoreState = _.debounce(() => {
		writeStoreState(true)
	}, 60000)
	
	
	
	
	// SUBSCRIBE TO SYSTEM EVENTS & UPDATES
	if (Env.isMain) {
		require('electron').app.on('will-quit',() => writeStoreState(false))
	}
	store.subscribe(onChange)
	

	// Just in case its an hmr request
	const
		existingRemoveListener = getHot(module, 'removeListener') as Function
	
	if (existingRemoveListener)
		existingRemoveListener()
	
	

	// On unload write the state
	if (typeof window !== 'undefined' && ProcessConfig.isUI) {
		window.addEventListener('beforeunload', () => {
			log.info(`Writing current state (shutdown) to: ${stateFilename}`)
			writeStoreState()
		})
	}
	
}

/**
 * Load and hydrate the state from disk
 *
 * @returns {any}
 */
export async function loadStateFromDisk() {
	let
		state = null
	
	try {
		// If state server then try and load from disk
		const
			stateData = await readFileAsync(stateFilename),
			stateJson = stateData && JSON.parse(stateData)
		
		
		state = stateJson && fromPlainObject(stateJson)
			
	
	} catch (err) {
		log.error('unable to load previous state data, starting fresh', err)
	
	}
	
	return state
}
