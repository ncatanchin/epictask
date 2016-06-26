import {List,Record,Map} from 'immutable'
import {ActionMessage} from 'typedux'
import {AuthKey} from 'shared/Constants'
import {registerModel} from 'shared/models/Registry'

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


registerModel(AuthKey,AuthState)