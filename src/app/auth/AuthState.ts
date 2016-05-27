

// const AuthStateType = makeRecordType(AuthStateModel).asType
// const AuthStateStaticType = makeRecordType(AuthStateModel).asStaticType

// export {
// 	AuthState
// }
//export type AuthStateType = AuthStateTypeWrapper.asType
import {
	RecordModel,
	RecordProperty,
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