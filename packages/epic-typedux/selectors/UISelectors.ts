import { Map, List } from "immutable"
import { createSelector } from "reselect"
import { UIState } from "../state/UIState"
import View from "epic-typedux/state/window/View"
import {
	createDeepEqualSelector,
	UIKey,
	getValue
} from "epic-global"


const
	log = getLogger(__filename)


export const uiStateSelector: (state) => UIState = createSelector(
	(state:any) => state.get(UIKey) as UIState,
	(uiState:UIState) => uiState
)



export const viewsSelector:TSelector<List<View>> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.views
)


export function makeViewSelector():TSelector<View> {
	return createSelector(
		viewsSelector,
		(state,props) => props.viewId as string,
		(views:List<View>,viewId:string) => views && views.find(it => it.id === viewId)
	)
}

export function makeViewStateSelector():TSelector<any> {
	return createSelector(
		makeViewSelector(),
		(view:View) => view && view.state
	)
}

// export const selectedViewIdSelector:TSelector<string> = createSelector(
// 	uiStateSelector,
// 	(uiState:UIState) => uiState.selectedViewId
// )

export const ideViewsSelector:TSelector<List<View>> = createSelector(
	viewsSelector,
	(views:List<View>) => views.filter(state => state.temp !== true) as List<View>
)

export const ideSelectedViewIdSelector:TSelector<string> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.selectedViewId
)



/**
 * Retrieve the current UI sheet
 */
export const sheetURISelector: (state) => string = createSelector(
	uiStateSelector,
	(state:UIState) => state.sheetURI
)

/**
 * Retrieve the current UI sheet params
 */
export const sheetParamsSelector: (state) => string = createSelector(
	uiStateSelector,
	(state:UIState) => state.sheetParams
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

