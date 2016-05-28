import {ActionFactory,Action} from 'typedux'
import {createClient} from 'shared/GitHubClient'
import {AuthKey} from "../../shared/Constants"
import {AppActionFactory} from '../AppActionFactory'
import {AuthState} from './AuthState'
import {AuthMessage} from './AuthReducer'
const {ipcRenderer} = require('electron')

const log = getLogger(__filename)
const gAppActions = new AppActionFactory()

export * from './AuthState'
export * from './AuthReducer'

export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	constructor() {
		super(AuthState)
	}

	leaf():string {
		return AuthKey;
	}

	// @Action({
	// 	reducers: [(state:typeof AuthState,msg:AuthMessage) => {
	// 		const token = msg.args[0]
	//
	// 		return state.withMutation(newState => {
	// 			newState.token = token
	// 			newState.authenticated = !newState.authenticated
	// 			return newState
	// 		})
	// 	}]
	// })
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

			appActions.setStateType(invalidUser ? AppStateType.Login : AppStateType.Ready)
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

					if (err) {
						actions.setError(err)
						appActions.setStateType(AppStateType.Login)
						reject(err)
					} else {
						actions.setToken(token)
						appActions.setStateType(AppStateType.VerifyLogin)
						resolve(token)
					}
				})

				ipcRenderer.send(AuthKey)
			})


		}
	}
}
