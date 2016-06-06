import {ActionFactory,Action} from 'typedux'
import {createClient} from '../../../shared/GitHubClient'
import {AuthKey} from "../../../shared/Constants"
import {AppActionFactory} from '../AppActionFactory'
import {AuthState} from './AuthState'
import {AuthMessage} from './AuthReducer'
import {AppStateType,Settings} from '../../../shared'

const {ipcRenderer} = require('electron')
const log = getLogger(__filename)
const gAppActions = new AppActionFactory()


export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	constructor() {
		super(AuthState)
	}

	leaf():string {
		return AuthKey;
	}

	@Action()
	setToken(token:string) {}

	@Action()
	setAuthenticating(authenticating:boolean) {
	}

	@Action()
	setError(err:Error) {

	}

	@Action()
	verify() {
		return async (dispatch,getState) => {
			const client = createClient()
			const user = await client.user()

			const appActions = gAppActions.withDispatcher(dispatch,getState)

			log.info(`Verified user as`,user)
			const invalidUser = !user || !user.login
			if (invalidUser) {
				log.error(`Invalid token, set login state`,user)
			}


			if (invalidUser)
				Settings.token = null

			appActions.setStateType(invalidUser ? AppStateType.AuthLogin : AppStateType.Home)
		}
	}



	@Action()
	logout() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch, getState)
			const appActions = gAppActions.withDispatcher(dispatch,getState)
			actions.setToken(null)
			appActions.setStateType(AppStateType.AuthLogin)
		}
	}

	@Action()
	authenticate() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const appActions = gAppActions.withDispatcher(dispatch,getState)
			actions.setAuthenticating(true)

			return new Promise((resolve,reject) => {
				ipcRenderer.once(AuthKey,(event,{err,token}) => {

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

				ipcRenderer.send(AuthKey)
			})


		}
	}
}
