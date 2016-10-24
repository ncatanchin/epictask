import { BaseService, IServiceConstructor, RegisterService, DatabaseClientService } from "epic-services"
import { ObservableStore } from "typedux"
import { AppStateType, getAppActions, getAuthActions } from "epic-typedux"
import { getSettings, ValueCache } from "epic-common"
import { ProcessType, AppKey } from "epic-global"

const log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export default class AppStateService extends BaseService {

	store:ObservableStore<any>


	private unsubscribe
	private stateTypeCache:ValueCache
	
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
	
	
	init(): Promise<this> {
		return super.init()
	}
	
	// loadDep(mod):any {
	// 	return Container.get(mod.default)
	// }
	//
	// loadDeps() {
	// 	this.appActions = this.loadDep((require as any)('shared/actions/AppActionFactory')) as AppActionFactory
	// 	this.repoActions = this.loadDep((require as any)('shared/actions/repo/RepoActionFactory')) as RepoActionFactory
	// 	this.authActions = this.loadDep((require as any)('shared/actions/auth/AuthActionFactory')) as AuthActionFactory
	// 	this.appActions = Container.get(AppActionFactory)// this.loadDep((require as any)('shared/actions/AppActionFactory')) as AppActionFactory
	// 	this.repoActions = Container.get(RepoActionFactory) //this.loadDep((require as any)//('shared/actions/repo/RepoActionFactory')) as RepoActionFactory
	// 	this.authActions = Container.get(AuthActionFactory)//this.loadDep((require as any)('shared/actions/auth/AuthActionFactory')) as AuthActionFactory
	//
	//
	// }

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
			return appActions.setStateType(token ? AppStateType.AuthVerify : AppStateType.AuthLogin)
		}
		
		
		log.info(`Checking auth token: (${token},${newValue})`)
		if (!token && newValue !== AppStateType.AuthLogin) {
			log.info(`Sending to LOGIN`)
			return appActions.setStateType(AppStateType.AuthLogin)
		} else if (token && newValue === AppStateType.AuthLogin) {
			return appActions.setStateType(AppStateType.AuthVerify)
		}
		
		log.info('New App State', newValue)
		//this.stateType = newStateType

		if (newValue === AppStateType.AuthVerify) {
			getAuthActions().verify()
		}
	}
}



if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}