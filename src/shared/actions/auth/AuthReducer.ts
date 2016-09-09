
import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "shared/Constants"
import {AuthState, AuthMessage} from 'shared/actions/auth/AuthState'
import {Provided} from 'shared/util/ProxyProvided'

@Provided
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