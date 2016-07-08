import {AutoWired, Inject} from 'typescript-ioc'
import {ActionFactory,Action} from 'typedux'
import {GitHubClient} from 'GitHubClient'
import {AuthKey,GitHubConfig} from "Constants"
import {AppActionFactory} from 'actions/AppActionFactory'
import {AuthState,AuthMessage} from 'actions/auth/AuthReducer'
import {AppStateType} from 'shared/AppStateType'
import {Settings} from 'Settings'
import {Toaster} from 'shared/Toaster'

const log = getLogger(__filename)

@AutoWired
export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	@Inject
	appActions:AppActionFactory

	@Inject
	toaster:Toaster


	@Inject
	client:GitHubClient

	constructor() {
		super(AuthState)
	}


	leaf():string {
		return AuthKey;
	}

	@Action()
	setToken(token:string) {}

	@Action()
	setAuthenticating(authenticating:boolean) {}

	@Action()
	setError(err:Error) {}

	@Action()
	verify() {
		return async (dispatch,getState) => {
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			const user = await this.client.user()

			log.info(`Verified user as`,user)
			const invalidUser = !user || !user.login
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
	authenticate() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const appActions = this.appActions.withDispatcher(dispatch,getState)
			actions.setAuthenticating(true)

			return new Promise((resolve,reject) => {
				//log.info('Got auth request',event)

				//const OAuthGithub = require('electron-oauth-github')
				const GitHubOAuthWindow = require('main/auth/GitHubOAuthWindow').default

				// Create a new auth request/window
				const authRequest = new GitHubOAuthWindow(GitHubConfig)

				// Start authentication
				authRequest.startRequest(function(err,token) {


					if (err) {
						log.error('GH token received: ' + token,err)
						this.toaster.addErrorMessage(err)
					} else {
						log.info('GH token received: ' + token,err)
					}

					Settings.token = err ? null : token

					if (err) {
						actions.setError(err)
						appActions.setStateType(AppStateType.AuthLogin)
						reject(err)
					} else {
						actions.setToken(token)
						appActions.setStateType(AppStateType.AuthVerify)
						resolve(token)
					}


				})
			})


		}
	}
}

export default AuthActionFactory