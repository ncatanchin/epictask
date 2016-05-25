import {
	RecordModel,
	RecordProperty,
	makeRecordType,
	makeRecord
} from 'typemutant'

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

export const AuthStateType = makeRecordType(AuthStateModel).asType
//export type AuthStateType = AuthStateTypeWrapper.asType