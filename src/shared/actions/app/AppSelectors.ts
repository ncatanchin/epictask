

import {createSelector} from 'reselect'
import {User} from 'shared/models/User'
import {AppKey} from 'shared/Constants'
import {AppState} from './AppState'

export const appStateSelector = (state):AppState => state.get(AppKey)
export const appUserSelector = (state):User => appStateSelector(state).user