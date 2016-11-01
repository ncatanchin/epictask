jest.mock('electron')
jest.mock('node-uuid')
jest.mock('typelogger')
import 'epic-entry-shared/Globals'


import { AuthState } from "epic-typedux/state/AuthState"
import { fromPlainObject } from "typetransform"
import { isNil, isMap } from "typeguard"



test(`Everything is running`,() => {
	const
		authState = new AuthState({authenticating: true})
	
	expect(authState.authenticating).toBe(true)
	
	const
		po = authState.toJS()
	
	expect(!isNil(po.$$value)).toBe(true)
	expect(po.$$value.authenticating).toBe(true)
	
	const
		hydrated = fromPlainObject(po)
	
	expect(isMap(hydrated)).toBe(true)
	
	
	const
		newAuthState = AuthState.fromJS(hydrated)
	
	expect(newAuthState instanceof AuthState).toBe(true)
	expect(newAuthState.authenticating).toBe(true)
})


export {
	
}