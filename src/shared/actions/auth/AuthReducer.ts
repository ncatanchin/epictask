
import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "Constants"
import {AuthState, AuthMessage} from 'shared/actions/auth/AuthState'


export class AuthReducer extends DefaultLeafReducer<AuthState,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState(o = {}):any {
		return AuthState.fromJS(o)
	}

	
	/**
	 * Set authenticating
	 *
	 * @param authenticating
	 * @returns {AuthState}
	 */
	setAuthenticating(state:AuthState,authenticating:boolean) {
		return state.merge({authenticating})
	}

	setError(state:AuthState,error:Error) {
		return state.merge({error})
	}

}