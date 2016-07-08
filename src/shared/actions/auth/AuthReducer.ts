import {List,Record,Map} from 'immutable'
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/models/Registry'

import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "Constants"
import {Settings} from 'Settings'



export interface IAuthState {
	authenticated?:boolean
	username?:string
	email?:string
	token?:string
	authenticating?:boolean
	error?:Error
}

export const AuthStateRecord = Record({
	authenticating: false,
	error: null,
	authenticated: false,
	username: null,
	email: null,
	token: null
})

@RegisterModel
export class AuthState extends AuthStateRecord {

	static fromJS(o:any) {
		return new AuthState(o)
	}

	authenticating:boolean

	error:Error

	authenticated:boolean

	username:string

	email:string

	token:string




}


export interface AuthMessage extends ActionMessage<AuthState> {
	token?:string
}



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