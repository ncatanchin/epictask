import { createSelector } from "reselect"
import { User } from "epic-models"
import { AppKey, getValue } from "epic-global"
import { AppState } from "../state/AppState"
import { AppStateType } from "../state/app/AppStateType"
import { Map } from "immutable"
import { TWindowMap } from "epic-typedux/state/AppState"
import { Settings } from "epic-global/settings/Settings"


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

export const appSettingsSelector: (state) => Settings = createSelector(
	appStateSelector,
	(state:AppState) => state.settings
)

export const appTokenSelector: (state) => string = createSelector(
	appStateSelector,
	(state:AppState) => getValue(() => state.settings.token,null)
)

export const windowsSelector: (state) => TWindowMap = createSelector(
	appStateSelector,
	(state:AppState) => state.windows
)




/**
 * Child window open
 */
export const openWindowsSelector = createSelector(
	windowsSelector,
	(windows:TWindowMap) => windows.size > 0
)

/**
 * Modal window open
 */
export const modalWindowOpenSelector = createSelector(
	windowsSelector,
	(windows:TWindowMap) =>
		!!windows.find(it => it.running && it.type === WindowType.Modal )
)

export const settingsSelector:(state) => Settings = createSelector(
	appStateSelector,
	(state:AppState) => state.settings
)