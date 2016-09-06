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

function makeDefaultToolPanels(basePanels = {}):Map<string,IToolPanel> {
	const defaultLocations = [
		ToolPanelLocation.Right,
		ToolPanelLocation.Left,
		ToolPanelLocation.Bottom
	]
	
	const panels = defaultLocations
		.map(location => ({id:ToolPanelLocation[location],location}))
		.map(({id,location}) => basePanels[id] ||
			{
				id,
				location,
				tools:{},
			})
	
	Object
		.keys(basePanels)
		.filter(id => !Object.keys(panels).includes(id))
		.forEach(id => panels[id] = basePanels[id])
	
	return panels
		.reduce((panels:Map<string,IToolPanel>, panel:IToolPanel) => {
			return panels.set(panel.id,panel)
		},Map<string,IToolPanel>())
		
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
	toolPanels:Map<string,IToolPanel>
	


}