import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import {DatabaseClientService} from './DatabaseClientService'
import { ObservableStore } from "typedux"
import { getAppActions, getAuthActions } from "epic-typedux/provider"
import { getSettings, ProcessType, AppKey} from "epic-global"
import {AppStateType} from 'epic-typedux/state/app/AppStateType'


const
	log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export default class AppStateService extends BaseService {
	
	/**
	 * ObservableStore
	 */
	private store:ObservableStore<any>
	
	/**
	 * Unsubscribe
	 */
	private unsubscribe
	
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	
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
	 * Start the AppStateService
	 *
	 * @returns {Promise<BaseService>}
	 */
	async start():Promise<this> {
		
		this.store = Container.get(ObservableStore as any) as any
		this.store.observe([AppKey,'stateType'],this.checkStateType)
		
		this.checkStateType(null,null)
		
		return super.start()
	}

	async stop():Promise<this> {
		if (this.unsubscribe)
			this.unsubscribe()
		
		return super.stop()
	}

	destroy():this {
		return this
	}

	/**
	 * Check for application state changes
	 */
	checkStateType = (newValue,oldValue) => {
		
		const appActions = getAppActions()
		
		const
			token = _.get(appActions.state,'settings.token',getSettings().token)
		
		log.info(`Checking app state type`,token,newValue,oldValue)
		
		if (!newValue) {
			return appActions.setStateType(token ? AppStateType.Authenticated : AppStateType.AuthLogin)
		}
		
		
		log.debug(`Checking auth token: (${token},${newValue})`)
		if (!token && newValue !== AppStateType.AuthLogin) {
			log.debug(`Sending to LOGIN`)
			return appActions.setStateType(AppStateType.AuthLogin)
		} else if (token && newValue === AppStateType.AuthLogin) {
			return appActions.setStateType(AppStateType.Authenticated)
		}
		
		log.debug('New App State', newValue)
	}
}



if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}