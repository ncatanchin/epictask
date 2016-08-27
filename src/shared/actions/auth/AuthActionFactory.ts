import {AutoWired, Inject,Container} from 'typescript-ioc'
import {ActionFactory,ActionReducer,Action} from 'typedux'
import {GitHubClient} from 'GitHubClient'
import {AuthKey,GitHubConfig} from "Constants"
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {AuthState,AuthMessage} from 'shared/actions/auth/AuthState'
import {AppStateType} from 'shared/AppStateType'
import {getSettings,getSettingsFile} from 'shared/Settings'
import {Toaster} from 'shared/Toaster'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {ProcessType} from "shared/ProcessType"

const log = getLogger(__filename)

@AutoWired
export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	@Inject
	appActions:AppActionFactory

	@Inject
	toaster:Toaster


	private _client:GitHubClient

	constructor() {
		super(AuthState)

		this.makeClient()
	}

	private makeClient() {
		return this._client = (getSettings().token) ? Container.get(GitHubClient) : null
	}

	get client() {
		return this._client || this.makeClient()
	}

	leaf():string {
		return AuthKey;
	}

	@ActionReducer()
	setToken(token:string) {
		return (state:AuthState) => {
			if (ProcessConfig.isType(ProcessType.StateServer)) {
				getSettings().token = token
				this.makeClient()
			}

			state = state.merge({
				token,
				authenticating:false,
				authenticated: !_.isNil(token),
				error:null
			}) as any


			return state

		}


	}

	@ActionReducer()
	setAuthenticating(authenticating:boolean) {
		return (state:AuthState) => state.merge({authenticating})
	}

	@Action()
	setError(err:Error) {}

	@Action()
	verify() {
		return async (dispatch,getState) => {
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			const user = await this.client.user()

			log.info(`Verified user as`,user)
			const
				Settings = getSettingsFile(),
				invalidUser = !user || !user.login
			
			
			if (invalidUser) {
				log.error(`Invalid token, set login state`,user)
				Settings.token = null
				Settings.user = null
			} else {
				Settings.user = user
			}

			appActions.setUser(user)
			appActions.setStateType(invalidUser ? AppStateType.AuthLogin : AppStateType.Home)
		}
	}



	@Action()
	logout() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			actions.setToken(null)
			appActions.setStateType(AppStateType.AuthLogin)
		}
	}

	@Action()
	setAuthResult(err:Error,token:string) {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			
			
			
			if (err) {
				actions.setError(err)
				appActions.setStateType(AppStateType.AuthLogin)
				
			} else {
				actions.setToken(token)
				const repoActions = Container.get(RepoActionFactory)
				repoActions.syncUserRepos()
				appActions.setStateType(AppStateType.AuthVerify)
				
			}
			
			if (err) {
				log.error('GH token received: ' + token,err)
				this.toaster.addErrorMessage(err)
			} else {
				
				log.info('GH token received: ' + token,err)
			}
			
			getSettingsFile().token = err ? null : token
			

		}
	}
}

export default AuthActionFactory