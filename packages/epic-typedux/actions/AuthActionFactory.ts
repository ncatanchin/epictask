import { ActionFactory, ActionReducer, ActionThunk } from "typedux"
import { GitHubClient, createClient as createGithubClient } from "epic-github"
import { AuthKey, Provided, RegisterActionFactory, GitHubConfig } from "epic-global"
import { getRepoActions, getAppActions } from "epic-typedux/provider"
import { AuthState, AuthMessage } from "../state/AuthState"
import { AppStateType } from "../state/app/AppStateType"
import { authenticatingSelector } from "../selectors"
import { User } from "epic-models"
import { addErrorMessage } from "epic-global/NotificationCenterClient"

const log = getLogger(__filename)

@RegisterActionFactory
@Provided
export class AuthActionFactory extends ActionFactory<AuthState,AuthMessage> {
	
	static leaf = AuthKey
	
	
	private _client:GitHubClient

	constructor() {
		super(AuthState)

	}


	get client() {
		return this._client || createGithubClient()
	}

	leaf():string {
		return AuthKey;
	}

	@ActionReducer()
	private setAuthenticated(
		authenticated:boolean,
		authenticating:boolean,
	  error:Error = null
	) {
		return (state:AuthState) => {
			state = state.merge({
				authenticating,
				authenticated,
				error
			}) as any
			
			
			return state
		}
	}
	

	@ActionThunk()
	setError(err:Error) {}
	
	/**
	 * Get the user with the provided token
	 *
	 * verifies token really
	 *
	 * @param token - if not provided then uses the stored token
	 */
	async getUser(token:string = null):Promise<User> {
		let
			user:User
		
		try {
			const
				client = createGithubClient(token)
			
			user = await client.user()
			
			log.debug(`Verified user as`, user)
			
		} catch (err) {
			log.error(`Unable to verify user`,this.client.getRateLimitInfo(),err)
			
			const
				errorMessage = err.statusCode === 403 ?
					`token is invalid or rate limit exceeded
								${this.client.getRateLimitInfoAsString()}` :
					err.message
			
			addErrorMessage(
				`Verification of Github API token failed:
					${errorMessage}`)
			
			
		}
		
		return user
		
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
			
			this.setAuthenticated(false,true)
			
			authRequest.start((err,token) => {
				this.setAuthResult(err,token)
			})
		}
	}


	@ActionThunk()
	logout() {
		return (dispatch,getState) => {
			const
				appActions = getAppActions()
			
			this.setAuthenticated(false,false)
			appActions.setAuthenticated(null,null)
		}
	}

	@ActionThunk()
	setAuthResult(err:Error,token:string) {
		return async (dispatch,getState) => {
			const
				appActions = getAppActions()
			
			let
				success = false
			
			if (err || !token) {
				this.setError(err)
				appActions.setStateType(AppStateType.AuthLogin)
				
				log.error('GH token received: ' + token,err)
				getNotificationCenter().addErrorMessage(err)
			} else {
				
				const
					user = await this.getUser(token)
				
				if (!user) {
					appActions.setAuthenticated(null,null)
				} else {
					
					
					appActions.setAuthenticated(user, token)
					getRepoActions().syncUserRepos()
					
					success = true
					
					log.info('GH token received: ' + token, err)
				}
			}
			
			
			this.setAuthenticated(success,false,!success && err)

		}
	}
}

export default AuthActionFactory