import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {AuthKey} from "../../../shared/Constants"
import {AuthState} from './AuthState'


export interface AuthMessage extends ActionMessage<typeof AuthState> {
	token?:string
}


export class AuthReducer extends DefaultLeafReducer<any,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState():any {
		return new AuthState()
	}
}