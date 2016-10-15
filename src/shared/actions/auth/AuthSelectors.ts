
import {createSelector} from 'reselect'
import { AuthKey } from "shared/Constants"
import { AuthState } from "shared/actions/auth/AuthState"
import {Map} from 'immutable'

export const authStateSelector: (state) => AuthState = createSelector(
	(state:Map<any,any>) => state.get(AuthKey),
	(authState:AuthState) => authState
)

export const authenticatingSelector: (state) => boolean = createSelector(
	authStateSelector,
	(authState:AuthState) => authState.authenticating
)