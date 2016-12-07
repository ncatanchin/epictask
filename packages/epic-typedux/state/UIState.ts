import { List, Record, Map } from "immutable"
import {
	INotification,
	RegisterModel,
	IToolPanel,
	makeToolPanels,
	getValue,
	cloneObjectShallow
} from "epic-global"
import { User } from "epic-models"
import { State } from "typedux"
import { toPlainObject,excludeFilterConfig,excludeFilter } from "typetransform"
import ViewState from "epic-typedux/state/window/ViewState"


const
	log = getLogger(__filename)

/**
 * Enumeration describing app status type
 */
export enum StatusType {
	Ready,
	Loading
}




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
	
	sheetURI:null,
	messages: List<INotification>(),
	
	toolPanels: makeToolPanels(),
	toolDragging: false,
	
	statusBar: {
		visible: true
	},
	
	jobs: {},
		
	viewStates: List<ViewState>()
})

/**
 * UIState class
 */
@RegisterModel
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
			viewStates: List(!o.viewStates ?
				[] :
				o.viewStates
					.filter(viewState => viewState.type && viewState.id && viewState.name)
					.map(viewState => ViewState.fromJS(viewState))),
			toolPanels
		}))
	}
	
	toJS() {
		
		return toPlainObject(
			cloneObjectShallow(super.toJS(),{
				viewStates: this.viewStates.map(viewState => viewState.toJS())
			}),
			excludeFilterConfig(
				...excludeFilter('messages','ready','toolDragging')
			))
	
	}
	
	ready:boolean
	user:User
	sheetURI:string
	messages:List<INotification>
	
	toolPanels:Map<string,IToolPanel>
	toolDragging:boolean
	
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
	
	viewStates: List<ViewState>
	


}