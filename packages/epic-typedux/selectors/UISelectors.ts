import { Map, List } from "immutable"
import { createSelector } from "reselect"
import { UIState } from "../state/UIState"
import View from "epic-typedux/state/window/View"
import {
	UIKey,
	getValue
} from "epic-global"
import { GithubNotification } from "epic-models"
import { TNotificationsMode } from "epic-typedux/state/UIState"
import { createDeepEqualSelector } from "epic-util"


const
	log = getLogger(__filename)


export const uiStateSelector: (state) => UIState = createSelector(
	(state:any) => state.get(UIKey) as UIState,
	(uiState:UIState) => uiState
)


export const notificationsModeSelector:TSelector<TNotificationsMode> = createSelector(
	uiStateSelector,
	(state:UIState) => state.notificationsMode
)


export const notificationsSelector:TSelector<List<GithubNotification>> = createSelector(
	uiStateSelector,
	notificationsModeSelector,
	(uiState:UIState,mode:TNotificationsMode) => {
		let
			notifications = uiState.notifications.sort((a, b) => {
			
			// SORT DESCENDING WITH PARTICIPATING AT TOP
			const
				aPart = a.reason !== 'subscribed',
				bPart = b.reason !== 'subscribed',
				aTime = a.updated_at,// new Date(a.updated_at).getTime(),
				bTime = b.updated_at,//new Date(b.updated_at).getTime(),
				timeComp = aTime === bTime ? 0 : aTime < bTime ? 1 : -1
			
			return ((aPart && bPart) || (!aPart && !bPart)) ?
				timeComp : // SAME GROUP - SO SORT BY TIME
				aPart ? -1 : // OR A IS PARTICIPATING
					1 // OR B
			
		}) as List<GithubNotification>
		
		if (mode === 'unread')
			notifications = notifications.filter(it => it.unread === true) as List<GithubNotification>
		
		return notifications
	}
)


export const selectedNotificationIdSelector:TSelector<number> = createSelector(
	uiStateSelector,
	(state:UIState) => state.selectedNotificationId
)

export const selectedNotificationSelector:TSelector<GithubNotification> = createSelector(
	selectedNotificationIdSelector,
	notificationsSelector,
	(id:number,notifications:List<GithubNotification>) => notifications.find(it => it.id === id)
)


export const unreadNotificationCountSelector:TSelector<number> = createSelector(
	notificationsSelector,
	(nList:List<GithubNotification>) => nList.count(it => it.unread === true)
)

export const participatingUnreadNotificationCountSelector:TSelector<number> = createSelector(
	notificationsSelector,
	(nList:List<GithubNotification>) => nList.count(it => it.reason !== 'subscribed' && it.unread === true)
)

export const notificationsOpenSelector:TSelector<boolean> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.notificationsOpen
)


export const viewsSelector:TSelector<List<View>> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.views
)

export const tabViewsSelector:TSelector<List<View>> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.tabViews
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


export const selectedTabViewIdSelector:TSelector<string> = createSelector(
	uiStateSelector,
	(uiState:UIState) => uiState.selectedTabViewId
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

