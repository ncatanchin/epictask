import {DefaultLeafReducer} from 'typedux'
import {AuthKey} from "shared/Constants"
import {AuthState,AuthMessage} from './AuthState'


export class AuthReducer extends DefaultLeafReducer<any,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState():any {
		return new AuthState()
	}
}