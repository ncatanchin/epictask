import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import {DatabaseClientService} from './DatabaseClientService'
import { ObservableStore } from "typedux"
import { ProcessType, AppKey, AppEventType } from "epic-global"
import { getUIActions } from "epic-typedux/provider"

const
	log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export default class UIStateService extends BaseService {
	
	/**
	 * ObservableStore
	 */
	private store:ObservableStore<any>
	
	/**
	 * Unsubscribe
	 */
	private unsubscribeRegistry
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	private onRegistryEvent = (event:AppEventType,...args:any[]) => {
		getUIActions().updateRegisteredTools()
	}
	
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
	}
	
	/**
	 * Init
	 *
	 * @returns {Promise<BaseService>}
	 */
	init(): Promise<this> {
		return super.init()
	}
	
	/**
	 * Start the UIStateService
	 *
	 * @returns {Promise<BaseService>}
	 */
	async start():Promise<this> {
		
		getUIActions().updateRegisteredTools()
		this.unsubscribeRegistry = EventHub.on(EventHub.ToolsChanged,this.onRegistryEvent)
		
		return super.start()
	}
	
	/**
	 * On stop unsubscribe from the registry
	 *
	 * @returns {Promise<BaseService>}
	 */
	async stop():Promise<this> {
		if (this.unsubscribeRegistry) {
			this.unsubscribeRegistry()
			this.unsubscribeRegistry = null
		}
		return super.stop()
	}
	
	/**
	 * On destroy do nothing
	 *
	 * @returns {UIStateService}
	 */
	destroy():this {
		return this
	}
	
}



if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}