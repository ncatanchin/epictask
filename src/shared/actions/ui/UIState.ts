import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {RegisterModel} from 'shared/Registry'
import {State} from "typedux"
import {IToolPanel, ToolPanelLocation, makeToolPanels} from "shared/tools/ToolTypes"

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
	dialogs: Map<string,boolean>(),
	messages: List<IToastMessage>(),
	toolPanels: makeToolPanels()
})

/**
 * UIState class
 */
@RegisterModel
export class UIState extends UIStateRecord implements State {

	static fromJS(o:any = {}) {
		if (ProcessConfig.isStateServer())
			log.info(`Inflating UIState from`,JSON.stringify(o,null,4))
		
		if (o && o instanceof UIState)
			return o
		
		return new UIState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
			toolPanels: makeToolPanels(o.toolPanels)
		}))
	}

	ready:boolean
	user:User
	dialogs:TDialogMap
	messages:List<IToastMessage>
	toolPanels:Map<string,IToolPanel>
	statusBar:{
		visible:boolean
	}


}