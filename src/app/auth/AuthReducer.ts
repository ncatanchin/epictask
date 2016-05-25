import {DefaultLeafReducer} from 'typedux'
import {AuthState,AuthStateType,AuthMessage} from './'
import {AuthKey} from 'shared/Constants'

export class AuthReducer extends DefaultLeafReducer<any,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}
}

