import {ActionFactory} from 'typedux'
import {AuthState,AuthMessage} from './'
import {AuthKey} from "shared/Constants"

export class AuthActionFactory extends ActionFactory<AuthState,AuthMessage> {

	constructor() {
		super(AuthState)
	}

	leaf():string {
		return AuthKey;
	}
}