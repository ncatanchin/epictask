import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import {ObservableStore} from 'typedux'
import {AppStateType} from 'shared/AppStateType'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {AuthActionFactory} from 'shared/actions/auth/AuthActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {getSettings} from 'shared/Settings'
import {DatabaseClientService} from "shared/services/DatabaseClientService"
import {ProcessType} from "shared/ProcessType"

const log = getLogger(__filename)

@RegisterService(ProcessType.StateServer)
export default class AppStateService extends BaseService {

	appActions:AppActionFactory
	authActions:AuthActionFactory
	repoActions:RepoActionFactory
	store:ObservableStore<any>


	private unsubscribe
	private stateType = null
	
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
		this.loadDeps() // Implemented this way for HMR
		
		return super.init()
	}
	
	loadDep(mod):any {
		return Container.get(mod.default)
	}

	loadDeps() {
		this.appActions = this.loadDep((require as any)('shared/actions/AppActionFactory')) as AppActionFactory
		this.repoActions = this.loadDep((require as any)('shared/actions/repo/RepoActionFactory')) as RepoActionFactory
		this.authActions = this.loadDep((require as any)('shared/actions/auth/AuthActionFactory')) as AuthActionFactory
		this.store = Container.get(ObservableStore as any) as any
		
	}

	async start():Promise<this> {
		this.unsubscribe = this.store
			.getReduxStore()
			.subscribe(this.checkStateType)

		// If the state type has not yet been set then set it
		if (!this.appActions.state.stateType || !getSettings().token) {
			const startingStateType = ((getSettings().token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
			this.appActions.setStateType(startingStateType)
		}

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
	checkStateType = async () => {

		const newStateType = this.appActions.state.stateType

		if (!newStateType || this.stateType === newStateType)
			return

		log.info('New App State', newStateType, "Old App State",this.stateType)
		this.stateType = newStateType

		if (this.stateType === AppStateType.AuthVerify) {
			this.authActions.verify()
		} else if (this.stateType === AppStateType.Home) {
			this.repoActions.loadAvailableRepos()
		}
	}
}



if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}