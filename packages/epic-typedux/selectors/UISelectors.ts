import { Map, List } from "immutable"
import { createSelector } from "reselect"
import { UIState } from "../state/UIState"
import ViewState from "epic-typedux/state/window/ViewState"
import {
	ToolPanelLocation,
	IToolPanel,
	createDeepEqualSelector,
	INotificationMessage,
	UIKey,
	ITool,
	getValue
} from "epic-global"


const
	log = getLogger(__filename)


export const uiStateSelector: (state) => UIState = createSelector(
	(state:any) => state.get(UIKey) as UIState,
	(uiState:UIState) => uiState
)



export const viewStatesSelector:TSelector<List<ViewState>> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.viewStates
)

/**
 * Retrieve the current UI sheet
 */
export const sheetURISelector: (state) => string = createSelector(
	uiStateSelector,
	(state:UIState) => state.sheetURI
)

/**
 * Get all tool panels
 */
export const toolPanelsSelector:(state) => Map<string,IToolPanel> =
	(state) => uiStateSelector(state).toolPanels
	// uiStateSelector,
	// (state:any) => state.toolPanels
	// (state:any) => state.get(UIKey).toolPanels,
	// (toolPanels) => toolPanels
//)


export const messagesSelector:(state) => List<INotificationMessage> = createSelector(
	uiStateSelector,
	(state:UIState) => state.messages
)

export const messagesSortedSelector:(state) => List<INotificationMessage> = createSelector(
	messagesSelector,
	(messages:List<INotificationMessage>) =>
		messages.sortBy(message => message.createdAt) as List<INotificationMessage>
)


/**
 * Tool is currently being dragged
 */
export const toolDraggingSelector = createSelector(
	uiStateSelector,
	(state:UIState) => state.toolDragging
)





export const createToolPanelIdSelector: () => (state) => string =
	() => createDeepEqualSelector(
		(state,props) => getValue(() => props),
		(props) => props.id
	)


export const createToolPanelLocationSelector: () => (state) => ToolPanelLocation =
	() => createDeepEqualSelector(
		(state,props) => getValue(() => props.location),
		(panelLocation) => panelLocation
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
		toolPanelsSelector,
		createToolPanelIdSelector(),
		createToolPanelLocationSelector(),
		(toolPanels, id,location) => {
			id = id || ToolPanelLocation[ location ]
			
			//log.info(`Got id ${id} and location ${location} and tool panels = `, uiState.toolPanels)
			
			return toolPanels.get(id)
			
		}
	)
}


export const createToolsSelector:() => TSelector<Map<string,ITool>> =
	() => createSelector(
		createToolPanelSelector() as any,
		(toolPanel:IToolPanel) => getValue(() => toolPanel.tools)
		// (state,props) => getValue(() => props.location),
		// (panelLocation) => panelLocation
	)as any

