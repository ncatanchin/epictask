
import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "Constants"
import {Settings} from 'Settings'
import {AuthState, AuthMessage} from 'shared/actions/auth/AuthState'


export {AuthState,AuthMessage}


export class AuthReducer extends DefaultLeafReducer<AuthState,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState(o = {}):any {
		return AuthState.fromJS(o)
	}

	/**
	 * Set authentication token
	 *
	 * @param token
	 * @returns {AuthStateModel}
	 */


	/**
	 * Set authenticating
	 *
	 * @param authenticating
	 * @returns {AuthStateModel}
	 */
	setAuthenticating(state:AuthState,authenticating:boolean) {
		return state.merge({authenticating})
	}

	setError(state:AuthState,error:Error) {
		return state.merge({error})
	}

}