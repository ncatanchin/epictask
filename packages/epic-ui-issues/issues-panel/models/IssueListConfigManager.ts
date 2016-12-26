import {List,Map,Record} from 'immutable'
import {
	ProxyWrap, PersistentValue, PersistentValueEvent, cloneObjectShallow, SimpleEventEmitter,
	addHotDisposeHandler, acceptHot, cloneObject
} from "epic-global"
import { IssueListConfig } from "./IssueListConfig"

/**
 * Created by jglanz on 12/24/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


interface IConfigStore {
	configs: Map<string,IssueListConfig>
	tabIds: Map<string,string>
}

/**
 * Serialize config to string
 *
 * @param store
 */
function serializeConfig(store:IConfigStore) {
	store = cloneObject(store)
	store.configs = store.configs.toJS()
	store.tabIds = store.tabIds.toJS()
	
	return JSON.stringify(store)
}

/**
 * Deserialize config
 *
 * @param value
 */
function deserializeConfig(value) {
	const
		configs = Map<string,IssueListConfig>().asMutable(),
		tabIds = Map<string,string>().asMutable()
	
	let
		store = (value && JSON.parse(value)) || {} as any
		
	
	store.configs && Object.values(store.configs)
		.forEach(config => {
			configs.set(config.id,IssueListConfig.fromJS(config))
		})
	
	store.tabIds && Object.entries(store.tabIds)
		.forEach(([tabId,configId]) => {
			tabIds.set(tabId,configId)
		})
	
	store.configs = configs.asImmutable()
	store.tabIds = tabIds.asImmutable()
	
	return store as IConfigStore
	
}


const
	DefaultIssueListConfigStore = {
		configs: Map<string,IssueListConfig>(),
		tabIds: Map<string,string>()
	},
	IssueListConfigStoreValue = new PersistentValue('IssueListConfigStore',DefaultIssueListConfigStore,serializeConfig,deserializeConfig)



/**
 * IssueListConfigManager
 *
 * @class IssueListConfigManager
 * @constructor
 **/
namespace IssueListConfigManager {
	
	const
		events = new SimpleEventEmitter()
	
	function onStoreChange(event,newVal) {
		log.debug(`Store changed`,newVal,'from event',event)
		
		events.emit(newVal)
	}
	
	
	
	IssueListConfigStoreValue.on(PersistentValueEvent.Changed,onStoreChange)
	
	// HMR
	addHotDisposeHandler(module,() => IssueListConfigStoreValue.removeListener(PersistentValueEvent.Changed, onStoreChange))
	
	/**
	 * Add a listener waiting for changes
	 *
	 * @param listener
	 */
	export function addListener(listener:() => any) {
		return events.addListener(listener)
	}
	
	/**
	 * Remove listener
	 *
	 * @param listener
	 */
	export function removeListener(listener:() => any) {
		return events.removeListener(listener)
	}
	
	export function setTabConfigId(tabId:string,configId:string) {
		const
			store = cloneObjectShallow(IssueListConfigStoreValue.get())
		
		store.tabIds = store.tabIds.set(tabId,configId)
		IssueListConfigStoreValue.set(store)
		
	}
	
	export function getTabConfigId(tabId:string) {
		return IssueListConfigStoreValue.get().tabIds.get(tabId)
	}
	
	export function getTabConfig(tabId:string):IssueListConfig {
		const
			configId = IssueListConfigStoreValue.get().configs.get(tabId)
		
		return (!configId) ? IssueListConfig.create() : this.getConfig(configId)
	}
	
	/**
	 * Get a config
	 *
	 * @param id
	 * @returns {V}
	 */
	export function getConfig(id:string):IssueListConfig {
		return IssueListConfigStoreValue.get().configs.get(id)
	}
	
	/**
	 * All configs
	 *
	 * @returns {List<IssueListConfig>}
	 */
	export function allConfigs():List<IssueListConfig> {
		return IssueListConfigStoreValue.get().configs.valueSeq() as any
	}
	
	/**
	 * Save an Issue List
	 *
	 * @param config
	 */
	export function saveConfig(config:IssueListConfig) {
		const
			store = cloneObjectShallow(IssueListConfigStoreValue.get())
		
		store.configs = store.configs.set(config.id,config)
		IssueListConfigStoreValue.set(store)
		
	}
	
	/**
	 * Remove issue list config by id
	 *
	 * @param id to remove
	 */
	export function remove(id:string) {
		const
			store = cloneObjectShallow(IssueListConfigStoreValue.get())
		
		store.configs = store.configs.remove(id)
		
		IssueListConfigStoreValue.set(store)
		
	}
	
	
	
	
}


if (DEBUG)
	assignGlobal({
		IssueListConfigManager,
		IssueListConfigStoreValue
	})

/**
 * Create the proxy for HMR
 */
const
	wrappedProxy = ProxyWrap<typeof IssueListConfigManager>(module,__filename,IssueListConfigManager) as typeof IssueListConfigManager

export {
	wrappedProxy as IssueListConfigManager
}

// HMR
acceptHot(module,log)