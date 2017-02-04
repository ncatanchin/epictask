

import {Record} from 'immutable'
import {ActionMessage} from 'typedux'
import { excludeFilterConfig, excludeFilter,toPlainObject } from "typetransform"
import { reviveImmutable } from "epic-util"

export const AuthStateRecord = Record({
	authenticating: false,
	error: null,
	authenticated: false
})


@Scopes.Models.Register
export class AuthState extends AuthStateRecord {

	static fromJS(o:any) {
		return reviveImmutable(o,AuthState)
	}
	
	toJS() {
		return toPlainObject(this,
			excludeFilterConfig(
				...excludeFilter('authenticating','error')))
	}

	authenticating:boolean

	error:Error

	authenticated:boolean


}


export interface AuthMessage extends ActionMessage<AuthState> {
	token?:string
}