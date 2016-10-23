
import { getSettingsFile } from "shared/settings/Settings"
const {Record} = Immutable
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'

export const AuthStateRecord = Record({
	authenticating: false,
	error: null,
	authenticated: false,
	username: null,
	email: null,
	token: getSettingsFile().token
})


@RegisterModel
export class AuthState extends AuthStateRecord {

	static fromJS(o:any) {
		if (o && o instanceof AuthState)
			return o
		
		return new AuthState(assign({},o,{
			authenticating: false
		}))
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