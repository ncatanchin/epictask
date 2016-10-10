

import {UIKey} from 'shared/Constants'
import {UIState} from 'shared/actions/ui/UIState'
import {createSelector} from 'reselect'
import { IWindowInstance,WindowManager } from "ui/WindowManager"
import { WindowType } from "shared/config/WindowConfig"
import { IUISheet } from "shared/config/DialogsAndSheets"


function getWindowManager():WindowManager {
	return require('ui/WindowManager').getWindowManager()
}

export const uiStateSelector = (state) => state.get(UIKey) as UIState

/**
 * All current open windows
 */
export const allWindowsSelector = (state) =>
	ProcessConfig.isUI() ? getWindowManager().all :
		[]

/**
 * Child window open
 */
export const childWindowOpenSelector = createSelector(
	allWindowsSelector,
	(windows:IWindowInstance[]) => windows.length > 0
)

/**
 * Modal window open
 */
export const modalWindowOpenSelector = createSelector(
	allWindowsSelector,
	(windows:IWindowInstance[]) =>
		!!getWindowManager().all.find(it => it.type === WindowType.Modal)
)

/**
 * Retrieve the current UI sheet
 */
export const sheetSelector: (state) => IUISheet = createSelector(
	uiStateSelector,
	(state:UIState) => state.sheet && _.isFunction(state.sheet.rootElement) ?
		state.sheet : null
)