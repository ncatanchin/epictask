import {ActionFactory,Action} from 'typedux'
import {AuthKey} from "shared/Constants"
import {AuthState} from './AuthState'
import {AuthMessage} from './AuthReducer'

export * from './AuthState'
export * from './AuthReducer'

export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	constructor() {
		super(AuthState)
	}

	leaf():string {
		return AuthKey;
	}

	@Action({
		reducers: [(state:typeof AuthState,msg:AuthMessage) => {
			const token = msg.args[0]

			return state.withMutation(newState => {
				newState.token = token
				newState.authenticated = !newState.authenticated
				return newState
			})
		}]
	})
	setToken(token:string) {}
}
