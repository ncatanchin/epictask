import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {RegisterModel} from 'shared/Registry'
import {State} from "typedux"
import {IToolPanel, ToolPanelLocation, makeToolPanels} from "shared/tools/ToolTypes"
import { IUISheet } from "shared/config/WindowConfig"
import { getValue, cloneObjectShallow } from "shared/util"

const log = getLogger(__filename)

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
	statusBar: {
		visible: true
	},
	sheet:null,
	dialogs: Map<string,boolean>(),
	messages: List<IToastMessage>(),
	
	toolPanels: makeToolPanels(),
	toolDragging: false
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
			panel.toolIds = getValue(() => panel.toolIds.length,0) ?
				panel.toolIds :
				Object.keys(panel.tools)
			
			toolPanels = toolPanels.set(panel.id,cloneObjectShallow(panel))
				
		})
		
		return new UIState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
			toolPanels
		}))
	}
	
	toJS() {
		return _.omit(super.toJS(),'messages')
	}
	
	ready:boolean
	user:User
	sheet:IUISheet
	dialogs:TDialogMap
	messages:List<IToastMessage>
	
	toolPanels:Map<string,IToolPanel>
	toolDragging:boolean
	
	statusBar:{
		visible:boolean
	}


}