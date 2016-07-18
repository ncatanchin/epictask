import {Singleton, AutoWired,Inject, Container} from 'typescript-ioc'
import {IService, ServiceStatus, BaseService} from './IService'
import {ObservableStore} from 'typedux'
import {AppStateType} from 'shared/AppStateType'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {AuthActionFactory} from 'shared/actions/auth/AuthActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Settings} from 'shared/Settings'
const electron = require('electron')




const log = getLogger(__filename)

@AutoWired
@Singleton
export default class AppStateService extends BaseService {

	appActions:AppActionFactory
	authActions:AuthActionFactory
	repoActions:RepoActionFactory
	store:ObservableStore<any>


	private unsubscribe
	private stateType = null



	constructor() {
		super()
		this.loadDeps() // Implemented this way for HMR
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
		await super.start()

		this.unsubscribe = this.store
			.getReduxStore()
			.subscribe(this.checkStateType)

		// If the state type has not yet been set then set it
		if (!this.appActions.state.stateType || !Settings.token) {
			const startingStateType = ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
			this.appActions.setStateType(startingStateType)
		}

		return this
	}

	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped

		if (this.unsubscribe)
			this.unsubscribe()

		return this
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
	module.hot.accept([
		'shared/actions/AppActionFactory',
		'shared/actions/auth/AuthActionFactory',
		'shared/actions/repo/RepoActionFactory'
	],(updates) => {
		Container.get(AppStateService).loadDeps()
	})


}


