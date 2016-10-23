
import {Map,List} from 'immutable'
import {createSelector} from 'reselect'

import {UIKey} from 'shared/Constants'
import {UIState} from 'shared/actions/ui/UIState'
import { IWindowInstance,WindowManager } from "ui/WindowManager"
import { IUISheet,WindowType } from "shared/config/WindowConfig"

import { ToolPanelLocation, IToolPanel } from "shared/tools/ToolTypes"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import { IToastMessage } from "shared/models/Toast"
import { jobDetailsSelector, jobsSelector } from "shared/actions/jobs/JobSelectors"
import { getValue } from "shared/util"

const
	log = getLogger(__filename)

function getWindowManager():WindowManager {
	return require('ui/WindowManager').getWindowManager()
}

export const uiStateSelector: (state) => UIState = createSelector(
	(state:any) => state.get(UIKey) as UIState,
	(uiState:UIState) => uiState
)

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

/**
 * Get all tool panels
 */
export const toolPanelsSelector:(state) => Map<string,IToolPanel> = createSelector(
	uiStateSelector,
	(state:UIState) =>
		state.toolPanels
)

/**
 * Tool is currently being dragged
 */
export const toolDraggingSelector = createSelector(
	uiStateSelector,
	(state:UIState) => state.toolDragging
)


export const createToolPanelLocationSelector: () => (state) => {id:string,location:ToolPanelLocation} =
	() => createDeepEqualSelector(
		(state,props) => _.pick(props || {}, 'id', 'location'),
		(panelLocation) => panelLocation
	)
	
export const messagesSelector:(state) => List<IToastMessage> = createSelector(
	uiStateSelector,
	(state:UIState) => state.messages
)

export const messagesSortedSelector:(state) => List<IToastMessage> = createSelector(
	messagesSelector,
	(messages:List<IToastMessage>) =>
		messages.sortBy(message => message.createdAt) as List<IToastMessage>
)

// (state):IToastMessage[] => _.orderBy(
// 	.toArray().map(msg => _.toJS(msg)) || [],
// 	['createdAt'],
// 	['desc'])
/**
 * Tool Panel selector based on prop id / location
 *
 */
export function createToolPanelSelector() {
	return createSelector(
		uiStateSelector,
		createToolPanelLocationSelector(),
		(uiState:UIState, { id, location }) => {
			id = id || ToolPanelLocation[ location ]
			
			//log.info(`Got id ${id} and location ${location} and tool panels = `, uiState.toolPanels)
			
			return uiState.toolPanels.get(id)
			
		}
	)
}

export const statusBarHasItemsSelector:(state) => boolean = createSelector(
	messagesSortedSelector,
	jobsSelector,
	(messages,jobs) =>
		getValue(() => Object.keys(jobs).length,0) + getValue(() => messages.size) > 0
)