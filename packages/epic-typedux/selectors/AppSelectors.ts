

import {createSelector} from 'reselect'
import {User} from "epic-models"
import {AppKey} from "epic-global"
import {AppState} from '../state/AppState'
import { AppStateType } from "../state/app/AppStateType"

export const appStateSelector = (state):AppState => state.get(AppKey)
export const appUserSelector = (state):User => appStateSelector(state).user

export const appStateTypeSelector: (state) => AppStateType = createSelector(
	appStateSelector,
	(state:AppState) => state.stateType
)