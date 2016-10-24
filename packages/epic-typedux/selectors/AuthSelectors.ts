
import {createSelector} from 'reselect'
import { AuthKey } from "epic-global"
import { AuthState } from "../state/AuthState"
import {Map} from 'immutable'

export const authStateSelector: (state) => AuthState = createSelector(
	(state:Map<any,any>) => state.get(AuthKey),
	(authState:AuthState) => authState
)

export const authenticatingSelector: (state) => boolean = createSelector(
	authStateSelector,
	(authState:AuthState) => authState.authenticating
)