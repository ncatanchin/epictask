// Imports

import { DropTarget, DropTargetConnector, DropTargetMonitor } from "react-dnd"
import { PureRender } from "../../common"
import { IThemedAttributes } from "epic-styles"
import { DraggableToolGutterButton } from "./ToolGutterButton"
import { TToolMap, IToolPanel, ITool, DragTypes, getValue } from "epic-global"
import filterProps from "react-valid-props"
import { getUIActions } from "epic-typedux"
import {Map,List} from 'immutable'

// Constants
const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)



/**
 * IToolGutterProps
 */
export interface IToolGutterProps extends IThemedAttributes {
	panel: IToolPanel
	dragging: boolean
	dndOver?:boolean
	dndItem?:any
	dndConnect?:Function
}


/**
 * ToolGutter
 *
 * @class ToolGutter
 * @constructor
 **/
@DropTarget<IToolGutterProps>(DragTypes.GutterToolButton,{
	drop(props,monitor,component) {
		const
			item = monitor.getItem(),
			tool:ITool = getValue(() => (item as any).tool)
		
		const
			thisPanelId = getValue(() => props.panel.id,null) as string
		
		log.debug(`Moving tool (${tool.id}) to panel (${thisPanelId})`)
		
		if (thisPanelId && tool)
			getUIActions().moveToolToPanel(thisPanelId,tool)
	},
	hover(props,monitor,component) {
		//log.debug(`DND Hover`, component, )
	}
}, (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
	dndConnect: connect.dropTarget(),
	dndOver: monitor.isOver(),
	dndItem: monitor.getItem()
}))
@Radium
@PureRender
export class ToolGutter extends React.Component<IToolGutterProps,any> {
	
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	
	render() {
		const
			{props} = this,
			{
				panel,
				styles,
				dragging,
				dndConnect,
				dndOver
			} = props,
			tools:TToolMap = getValue(() => panel.tools,Map<string,ITool>()),
			toolIds = getValue(() => panel.toolIds,List<string>())
		
		return dndConnect(<div
			{...filterProps(props)}
			style={[
				styles,
				styles[panel.location],
				dragging && styles.dragging,
				dndOver && styles.dragHover
			]}
		>
			{toolIds.map(toolId => {
				const
					tool = tools.get(toolId)
							
				return <DraggableToolGutterButton
					key={toolId}
					tool={tool}
					panel={panel}/>
			})}
			{/*<div style={FlexScale}></div>*/}
		</div>)
	}
	
}