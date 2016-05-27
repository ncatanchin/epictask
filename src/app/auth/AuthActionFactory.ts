import {ActionFactory,Action} from 'typedux'
import {AuthKey} from "shared/Constants"
import {AuthState} from './AuthState'
import {AuthMessage} from './AuthReducer'
import {ipcRenderer} from 'electron'

const log = getLogger(__filename)

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
	authenticate() {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			actions.setAuthenticating(true)

			return new Promise((resolve,reject) => {
				ipcRenderer.once(AuthKey,(event,{err,token}) => {

					if (err) {
						actions.setError(err)
						reject(err)
					} else {
						actions.setToken(token)
						resolve(token)
					}
				})

				ipcRenderer.send(AuthKey)
			})


		}
	}
}
