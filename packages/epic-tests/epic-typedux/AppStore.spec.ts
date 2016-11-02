import 'jest'

jest.mock('electron')
jest.mock('node-uuid')

//jest.mock('typelogger')
import 'epic-entry-shared/LogConfig'
import 'epic-entry-shared/Globals'
assignGlobal({assert:require('assert')})

import { AuthState } from "epic-typedux/state/AuthState"
import { fromPlainObject } from "typetransform"
import { isNil, isMap } from "typeguard"



test(`Everything is running`,() => {
	const
		authState = new AuthState({
			authenticated: true,
			authenticating: true
		})
	
	expect(authState.authenticated).toBe(true)
	
	const
		po = authState.toJS()
	
	
	
	expect(!isNil(po.$$value)).toBe(true)
	
	console.log(po)
	expect(po.$$value.authenticated).toBe(true)
	
	const
		hydrated = fromPlainObject(po)
	
	expect(isMap(hydrated)).toBe(true)
	
	
	const
		newAuthState = AuthState.fromJS(hydrated)
	
	console.log(`hydrated`,hydrated,'new auth state',newAuthState,newAuthState.authenticated)
	expect(newAuthState instanceof AuthState).toBeTruthy()
	expect(newAuthState.authenticated).toBeTruthy()
	expect(newAuthState.authenticating).toBeFalsy()
})



export {
	
}