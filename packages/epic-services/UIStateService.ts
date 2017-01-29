import { BaseService,  RegisterService } from "./internal"
import {DatabaseClientService} from './DatabaseClientService'
import { ObservableStore } from "typedux"
import { ProcessType, AppKey, AppEventType, guard } from "epic-global"
import { getUIActions } from "epic-typedux/provider"

const
	log = getLogger(__filename)

//log.setOverrideLevel(LogLevel.DEBUG)

@RegisterService(ProcessType.UI)
export default class UIStateService extends BaseService {
	
	static readonly ServiceName = "UIStateService"
	
	/**
	 * Unsubscribe
	 */
	private unsubscribers
	
	
	private onRegistryEvent = (event:AppEventType,...args:any[]) => {
		getUIActions().updateRegisteredTools()
	}
	
	private updateZoom = (newZoom = null) => {
		if (!newZoom)
			newZoom = getStoreState().get(AppKey).zoom
		
		log.debug(`Setting zoom to: ${newZoom}`)
		guard(() => require('electron').remote.getCurrentWebContents().setZoomFactor(newZoom))
	}
	
	
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
	}
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
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
		this.unsubscribers = [
			EventHub.on(EventHub.ToolsChanged,this.onRegistryEvent),
			getStore().observe([AppKey,'zoom'],this.updateZoom)
		]
		
		this.updateZoom()
		
		return super.start()
	}
	
	/**
	 * On stop unsubscribe from the registry
	 *
	 * @returns {Promise<BaseService>}
	 */
	async stop():Promise<this> {
		if (this.unsubscribers) {
			this.unsubscribers.forEach(guard)
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