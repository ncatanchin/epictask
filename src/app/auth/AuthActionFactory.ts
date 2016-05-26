import {ActionMessage,DefaultLeafReducer,ActionFactory,Action} from 'typedux'
import {AuthKey} from "shared/Constants"
import {RecordTypeWrapper,RecordBaseObject} from 'typemutant'

import {
	RecordModel,
	RecordProperty,
	//makeRecordType,
	makeRecord
} from 'typemutant'


export interface IAuthState {
	authenticated?:boolean
	username?:string
	email?:string
	token?:string
}

@RecordModel()
class AuthStateModel {

	@RecordProperty()
	authenticated:boolean = false

	@RecordProperty()
	username:string

	@RecordProperty()
	email:string

	@RecordProperty()
	token:string

}

export const AuthState = makeRecord(AuthStateModel)
//const tw = new RecordTypeWrapper(AuthState,AuthState)
// 	.mixType(AuthStateModel,AuthStateModel)
// 	.mixType(RecordBaseObject,RecordBaseObject)

//const AuthStaticType = AuthState //tw.asStaticType
//type AuthType = typeof tw.asType
export class AuthActionFactory extends ActionFactory<any,AuthMessage> {

	constructor() {
		super(AuthState)
	}

	leaf():string {
		return AuthKey;
	}

	@Action({
		reducers: [(state:typeof AuthState,msg:AuthMessage) => {
			const token = msg.args[0]

			return state.withMutation(newState => {
				newState.token = token
				newState.authenticated = !newState.authenticated
				return newState
			})
		}]
	})
	setToken(token:string) {}
}





//const recordType:{new()} = AuthType

export interface AuthMessage extends ActionMessage<typeof AuthState> {
	token?:string
}

export class AuthReducer extends DefaultLeafReducer<any,AuthMessage> {

	constructor() {
		super(AuthKey,AuthState)
	}


	defaultState():any {
		return new AuthState({
			authenticated: false
		})
	}
}

