import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "../../Constants"
import {AuthState,AuthMessage} from './AuthState'
import {Settings} from '../../Settings'


export class AuthReducer extends DefaultLeafReducer<AuthState,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState():any {
		return new AuthState()
	}

	/**
	 * Set authentication token
	 *
	 * @param token
	 * @returns {AuthStateModel}
	 */
	setToken(state:AuthState,token:string) {
		return state.merge({
			token: Settings.token = token,
		authenticating:false,
		authenticated: !_.isNil(token),
			error:null
		})

	}


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