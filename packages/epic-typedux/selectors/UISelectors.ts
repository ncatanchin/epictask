
import {Map,List} from 'immutable'
import {createSelector} from 'reselect'

import {UIKey} from "epic-global"
import {UIState} from "../state/UIState"
import { IUISheet,WindowType,IWindowInstance,WindowManager } from "epic-process-manager"


import { ToolPanelLocation, IToolPanel } from "epic-global"
import { createDeepEqualSelector } from  "epic-common"
import { INotificationMessage } from "epic-global"
import { jobDetailsSelector, jobsSelector } from "./JobSelectors"
import { getValue } from  "epic-common"

const
	log = getLogger(__filename)

function getWindowManager():WindowManager {
	return require('epic-process-manager').getWindowManager()
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
	
export const messagesSelector:(state) => List<INotificationMessage> = createSelector(
	uiStateSelector,
	(state:UIState) => state.messages
)

export const messagesSortedSelector:(state) => List<INotificationMessage> = createSelector(
	messagesSelector,
	(messages:List<INotificationMessage>) =>
		messages.sortBy(message => message.createdAt) as List<INotificationMessage>
)

// (state):INotificationMessage[] => _.orderBy(
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