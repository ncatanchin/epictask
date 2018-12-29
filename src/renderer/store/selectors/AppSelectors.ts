import {createSelector, Selector} from "reselect"

import {AppState} from "renderer/store/state/AppState"

export function appSelector<T>(
	fn:(state:AppState, props?:any) => T
):Selector<IRootState,T> {
	return ((state:IRootState,props:any) => fn(state.AppState,props) as T) as any
}

export const userSelector = appSelector(state => state.user)

