

import {Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {RegisterModel} from "epic-global/Registry"
import { excludeFilterConfig, excludeFilter,toPlainObject } from "typetransform"
import { reviveImmutable } from "epic-global/ModelUtil"

export const AuthStateRecord = Record({
	authenticating: false,
	error: null,
	authenticated: false
})


@RegisterModel
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