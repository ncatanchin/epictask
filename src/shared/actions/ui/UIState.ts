import {List,Record,Map} from 'immutable'

import {IToastMessage} from 'shared/models/Toast'
import {User} from 'shared/models/User'
import {RegisterModel} from 'shared/Registry'
import {State} from "typedux"
import {IToolPanel,ToolPanelLocation} from "shared/tools/ToolTypes"


/**
 * Enumeration describing app status type
 */
export enum StatusType {
	Ready,
	Loading
}

function makeDefaultToolPanels(basePanels = []) {
	const defaultLocations = [
		ToolPanelLocation.Right,
		ToolPanelLocation.Left,
		ToolPanelLocation.Bottom
	]
	
	return defaultLocations.map(location => basePanels.find(it => it.location === location) ||{
		id: ToolPanelLocation[location],
		location,
		tools:[],
	}).concat(
		basePanels.filter(it => !defaultLocations.includes(it.location))
	).reduce((panels:List<IToolPanel>, panelState:IToolPanel) => {
		return panels.push(panelState)
	},List<IToolPanel>())
}


/**
 * Simple status management for the app overall
 */
export interface IStatus {
	type:StatusType
	message?:string
}



export type TDialogMap = Map<string,boolean>



export const UIStateRecord = Record({
	ready: false,
	user: null,
	
	dialogs: Map<string,boolean>(),
	messages: List<IToastMessage>(),
	toolPanels: makeDefaultToolPanels()
})

@RegisterModel
export class UIState extends UIStateRecord implements State {

	static fromJS(o:any = {}) {
		if (o && o instanceof UIState)
			return o
		
		return new UIState(Object.assign({},o,{
			messages: List(o.messages),
			dialogs: Map(o.dialogs),
			toolPanels: makeDefaultToolPanels(o.toolPanels)
		}))
	}

	ready:boolean
	user:User
	dialogs:TDialogMap
	messages:List<IToastMessage>
	toolPanels:List<IToolPanel>
	


}