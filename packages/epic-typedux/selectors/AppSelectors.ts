

import {createSelector} from 'reselect'
import {User} from "epic-models"
import { AppKey, getValue } from "epic-global"
import {AppState} from '../state/AppState'
import { AppStateType } from "../state/app/AppStateType"
import { ISettings } from "epic-global/settings"
import {Map} from "immutable"

export const appStateSelector:(state) => AppState = createSelector(
	(state:Map<string,any>) => state.get(AppKey) as AppState,
	(appState:AppState) => appState
)

export const appUserSelector:(state) => User = createSelector(
	appStateSelector,
	(appState:AppState) => appState.user
)

export const appStateTypeSelector: (state) => AppStateType = createSelector(
	appStateSelector,
	(state:AppState) => state.stateType
)

export const appSettingsSelector: (state) => ISettings = createSelector(
	appStateSelector,
	(state:AppState) => state.settings
)

export const appTokenSelector: (state) => string = createSelector(
	appStateSelector,
	(state:AppState) => getValue(() => state.settings.token,null)
)


