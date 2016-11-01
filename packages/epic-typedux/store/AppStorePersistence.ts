
import {
	OnlyIfFn, RepoKey, writeFile, getHot, getUserDataFilename, writeFileAsync,
	readFile, isString
} from "epic-global"
import { RepoState } from "../state/RepoState"
import { IFilterConfig } from "typetransform"
const
	log = getLogger(__filename),
	stateFilename = getUserDataFilename(`epictask-store-state-${getProcessId()}.json`)

let
	persistingState = false,
	getStoreState = null


const DefaultStoreStatePersistenceFilter:IFilterConfig = {
	defaultExcluded: false,
	filters: [
		
	]
}

/**
 * Serialize the current state as a string
 *
 * @returns {string}
 */
export function serializeState(state = null, filter:IFilterConfig = null) {
	if (!state)
		state = (getStoreState && getStoreState()) || {}
		
	return JSON.stringify(_.toJS(state))
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
		persistStoreState(getStoreState())
	}
	
	store.subscribe(onChange)
	
	/**
	 * Write the actual state async
	 */
	function writeStoreState(state = null, doAsync = false) {
		if (!state)
			state = (getStoreState && getStoreState()) || {}
		//
		// if (!ProcessConfig.isType(ProcessType.UI))
		// 	return Promise.resolve()
		
		log.info(`Writing current state to: ${stateFilename}`)
		if (persistingState) {
			log.info('Persisting, can not persist until completion')
			return
		}
		
		persistingState = true
		
		if (doAsync)
			return Promise
				.resolve(writeFileAsync(stateFilename, serializeState(state)))
				.catch(err => {
					log.error('state persistence failed', err)
				})
				.finally(() => persistingState = false)
		
		try {
			
			// TODO: Add Storage store filter
			
			//writeFile(stateFilename, serializeState(state))
			const
				js = _.toJS(state),
				repoState = _.get(js, RepoKey, null) as RepoState
			
			if (repoState && repoState.availableRepos)
				delete repoState[ 'availableRepos' ]
			
			
			writeFile(stateFilename, JSON.stringify(js))
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
	const persistStoreState = OnlyIfFn(canPersistState, _.debounce((state) => {
		writeStoreState(state, true)
	}, 10000, {
		maxWait: 30000
	}))
	
	

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

export function loadStateFromDisk() {
	try {
		// If state server then try and load from disk
		const
			stateJson = readFile(stateFilename)
		
		if (stateJson) {
			let
				count = 0,
				stateData = stateJson
			
			while (isString(stateData) && count < 3) {
				stateData = JSON.parse(stateData)
			}
			
			return stateData
			//log.info(`Read state from file`, JSON.stringify(defaultStateValue[ UIKey ], null, 4))
		}
	} catch (err) {
		log.error('unable to load previous state data, starting fresh', err)
		return {}
	}
}
