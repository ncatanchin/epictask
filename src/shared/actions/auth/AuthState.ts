const {List,Record,Map} = Immutable
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'

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