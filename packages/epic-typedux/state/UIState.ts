import { List, Record, Map } from "immutable"
import {
	getValue,
	cloneObjectShallow
} from "epic-global"
import { User, GithubNotification } from "epic-models"
import { State } from "typedux"
import { toPlainObject,excludeFilterConfig,excludeFilter } from "typetransform"
import View from "epic-typedux/state/window/View"
import { makeToolPanels } from "epic-util"


const
	log = getLogger(__filename)

/**
 * Enumeration describing app status type
 */
export enum StatusType {
	Ready,
	Loading
}

export type TNotificationsMode = 'unread'|'all'


/**
 * Simple status management for the app overall
 */
export interface IStatus {
	type:StatusType
	message?:string
}



export type TDialogMap = Map<string,boolean>


/**
 * UIState base record
 */
export const UIStateRecord = Record({
	ready: false,
	user: null,
	
	selectedNotificationId: null,
	notificationsMode: 'unread',
	notificationsOpen: false,
	notificationsLoaded: false,
	notificationsLoading: false,
	notifications:List<GithubNotification>(),
		
	sheetURI:null,
	sheetParams:null,
	//messages: List<INotification>(),
	
	toolPanels: makeToolPanels(),
	toolDragging: false,
	
	statusBar: {
		visible: true
	},
	
	jobs: {},
		
	views: List<View>(),
	tabViews: List<View>(),
	
	selectedTabViewId: null
})

/**
 * UIState class
 */
@ModelRegistryScope.Register
export class UIState extends UIStateRecord implements State {

	static fromJS(o:any = {}) {
		if (o && o instanceof UIState)
			return o
		
		let
			toolPanels = makeToolPanels(o.toolPanels),
			toolPanelList = toolPanels.valueSeq()
		
		// Make sure tool ids are set
		toolPanelList.forEach((panel:IToolPanel) => {
			panel.toolIds = getValue(() => panel.toolIds.size,0) ?
				panel.toolIds : List(panel.tools.keySeq()) as any
			
			toolPanels = toolPanels.set(panel.id,cloneObjectShallow(panel))
				
		})
		
		return new UIState(assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
			notifications: List(o.notifications),
			views: List(!o.views ?
				[] : o.views .filter(view => view.type && view.id && view.name)
				.map(view => View.fromJS(view))),
			tabViews: List(!o.tabViews ?
				[] : o.tabViews.filter(view => view.type && view.id && view.name)
					.map(view => View.fromJS(view))),
			toolPanels
		}))
	}
	
	toJS() {
		
		return toPlainObject(
			cloneObjectShallow(super.toJS(),{
				views: this.views
					.filter(state => state.temp !== true)
					.map(view => view.toJS())
			}),
			excludeFilterConfig(
				...excludeFilter(
					'messages',
					'ready',
					'toolDragging',
					'sheetURI',
					'sheetParams',
					'notificationsLoaded',
					'notificationsLoading',
					'notifications'
				)
			))
	
	}
	
	ready:boolean
	user:User
	sheetURI:string
	sheetParams:any
	//messages:List<INotification>
	
	toolPanels:Map<string,IToolPanel>
	toolDragging:boolean
	
	selectedNotificationId:number
	notificationsMode:TNotificationsMode
	notificationsOpen:boolean
	notificationsLoaded: boolean
	notificationsLoading: boolean
	notifications:List<GithubNotification>
	
	statusBar:{
		visible:boolean
	}
	
	jobs: {
		
		/**
		 * Selected Job Id
		 */
		selectedId:string
		
		/**
		 * Selected log id
		 */
		selectedLogId:string
	}
	
	selectedTabViewId:string
	tabViews: List<View>
	views: List<View>
	


}