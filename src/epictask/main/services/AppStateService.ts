import {Singleton, AutoWired,Inject, Container} from 'typescript-ioc'
import {IService, ServiceStatus} from './IService'
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
export default class AppStateService implements IService {

	@Inject
	appActions:AppActionFactory

	@Inject
	authActions:AuthActionFactory

	@Inject
	repoActions:RepoActionFactory

	@Inject
	store:ObservableStore<any>

	private _status = ServiceStatus.Created
	private stateType = null


	status():ServiceStatus {
		return this._status
	}

	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		return this
	}

	async start():Promise<this> {
		this._status = ServiceStatus.Started
		this.store.observe([this.appActions.leaf(),'stateType'],this.checkStateType)

		// If the state type has not yet been set then set it
		if (!this.appActions.state.stateType) {
			const startingStateType = ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
			this.appActions.setStateType(startingStateType)
		}

		if (module.hot) {
			module.hot.accept([
				'shared/actions/AppActionFactory',
				'shared/actions/auth/AuthActionFactory',
				'shared/actions/repo/RepoActionFactory'
			],updates => {
				this.start()
			})
		}

		return this
	}

	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped
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
			this.repoActions.getRepos()
				.then(() => this.repoActions.getAvailableRepos())
				.then(() => this.repoActions.syncRepos())


		}
	}
}


