import {ActionFactory,ActionReducer,ActionThunk} from 'typedux'
import {GitHubClient} from 'shared/GitHubClient'
import {AuthKey} from "shared/Constants"
import {AppActionFactory} from '../app/AppActionFactory'
import {AuthState,AuthMessage} from 'shared/actions/auth/AuthState'
import {AppStateType} from 'shared/AppStateType'
import {getSettings,getSettingsFile} from 'shared/settings/Settings'
import { Toaster, addErrorMessage } from 'shared/Toaster'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {ProcessType} from "shared/ProcessType"
import {Provided} from 'shared/util/ProxyProvided'
import { RegisterActionFactory } from "shared/Registry"
import { Settings } from "shared/settings/SettingsFile"

const log = getLogger(__filename)

@RegisterActionFactory
@Provided
export class AuthActionFactory extends ActionFactory<AuthState,AuthMessage> {
	
	static leaf = AuthKey
	
	appActions:AppActionFactory
	toaster:Toaster

	private _client:GitHubClient

	constructor() {
		super(AuthState)

		this.appActions = Container.get(AppActionFactory)
		this.toaster = Container.get(Toaster)
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
	private setTokenInternal(token) {
		return (state:AuthState) => {
			state = state.merge({
				token,
				authenticating:false,
				authenticated: !_.isNil(token),
				error:null
			}) as any
			
			
			return state
		}
	}
	
	@ActionThunk()
	setToken(token:string) {
		return (dispatch,getState) => {
			
			log.info('Setting token',token)
			Settings.token = token
			
			this.makeClient()
			this.setTokenInternal(token)
			
			//settings.save()
		}


	}

	@ActionReducer()
	setAuthenticating(authenticating:boolean) {
		return (state:AuthState) => state.merge({authenticating})
	}

	@ActionThunk()
	setError(err:Error) {}

	@ActionThunk()
	verify() {
		return async (dispatch,getState) => {
			log.info(`Verifying user`)
			
			try {
				const
					appActions = this.appActions.withDispatcher(dispatch, getState),
					user = await this.client.user()
				
				log.info(`Verified user as`, user)
				const
					Settings = getSettingsFile(),
					invalidUser = !user || !user.login
				
				
				if (invalidUser) {
					log.error(`Invalid token, set login state`, user)
					Settings.token = null
					Settings.user = null
				} else {
					Settings.user = user
				}
				
				appActions.setUser(user)
				appActions.setStateType(invalidUser ? AppStateType.AuthLogin : AppStateType.Home)
			} catch (err) {
				log.error(`Unable to verify user`,this.client.getRateLimitInfo(),err)
				
				const
					errorMessage = err.statusCode === 403 ?
						`token is invalid or rate limit exceeded 
								${this.client.getRateLimitInfoAsString()}` :
						err.message
				
				addErrorMessage(`Verification of Github API token failed: 
					${errorMessage}`)
			}
		}
		
	}



	@ActionThunk()
	logout() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			actions.setToken(null)
			appActions.setStateType(AppStateType.AuthLogin)
		}
	}

	@ActionThunk()
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
			
			
			

		}
	}
}

export default AuthActionFactory