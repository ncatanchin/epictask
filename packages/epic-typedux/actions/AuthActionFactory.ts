import {ActionFactory,ActionReducer,ActionThunk} from 'typedux'
import {GitHubClient} from "epic-github"
import {AuthKey} from "epic-global"
import {AuthState,AuthMessage} from "epic-typedux"
import {AppStateType} from '../state/app/AppStateType'
import {getSettings,getSettingsFile} from "epic-global"
import { NotificationCenter, addErrorMessage, getNotificationCenter } from "epic-global"

import {Provided} from  "epic-global"
import { RegisterActionFactory } from "epic-global"
import { Settings } from "epic-global"
import { getRepoActions, getAppActions } from "epic-typedux"
import { GitHubConfig } from "epic-global"
import { authenticatingSelector } from "../selectors"

const log = getLogger(__filename)

@RegisterActionFactory
@Provided
export class AuthActionFactory extends ActionFactory<AuthState,AuthMessage> {
	
	static leaf = AuthKey
	
	
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
					appActions = getAppActions(),
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
				appActions.setStateType(invalidUser ? AppStateType.AuthLogin : AppStateType.Authenticated)
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
	startAuth() {
		return (dispatch,getState) => {
			if (authenticatingSelector(getState())) {
				log.debug(`Already authenticating`)
				return
			}
				
			const
				GitHubOAuthWindow = require('./auth/GitHubOAuthWindow').default,
				authRequest = new GitHubOAuthWindow(getCurrentWindow(),GitHubConfig)
			
			this.setAuthenticating(true)
			
			authRequest.start((err,token) => {
				this.setAuthenticating(false)
				this.setAuthResult(err,token)
			})
		}
	}


	@ActionThunk()
	logout() {
		return (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch, getState),
				appActions = getAppActions()
			actions.setToken(null)
			appActions.setStateType(AppStateType.AuthLogin)
		}
	}

	@ActionThunk()
	setAuthResult(err:Error,token:string) {
		return (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				appActions = getAppActions()
			
			
			
			if (err) {
				actions.setError(err)
				appActions.setStateType(AppStateType.AuthLogin)
				
			} else {
				actions.setToken(token)
				const repoActions = getRepoActions()
				repoActions.syncUserRepos()
				appActions.setStateType(AppStateType.Authenticated)
				
			}
			
			if (err) {
				log.error('GH token received: ' + token,err)
				getNotificationCenter().addErrorMessage(err)
			} else {
				
				log.info('GH token received: ' + token,err)
			}
			
			
			

		}
	}
}

export default AuthActionFactory