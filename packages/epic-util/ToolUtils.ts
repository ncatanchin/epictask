import {Map,List} from 'immutable'
import { isMap } from "typeguard"

/**
 * Create tool shape
 * @param id
 * @param defaultLocation
 * @param active
 * @param label
 * @param buttonLabel
 * @param data
 * @returns {ITool}
 */
export function makeDefaultTool(
	id:string,
	defaultLocation =ToolPanelLocation.Left,
	active = true,
	label = id,
	buttonLabel = label,
	data = {}
):ITool {
	return {
		id,
		label,
		buttonLabel,
		defaultLocation,
		active,
		data
	}
}

/**
 * Create an empty default panel
 *
 * @param location
 * @param open
 * @returns {{id: any, location: ToolPanelLocation, tools: {}, open: boolean}}
 */
export function makeDefaultToolPanel(location:ToolPanelLocation, open = false) {
	return {
		id: ToolPanelLocation[location],
		location,
		tools: Map<string,ITool>(),
		toolIds: List<string>(),
		open
	}
}

/**
 * Make tool panels
 *
 * @param fromPanels - from existing panels
 * @returns {Map<string,IToolPanel>}
 */
export function makeToolPanels(fromPanels = {}):Map<string,IToolPanel> {
	const
		defaultLocations = [
			ToolPanelLocation.Right,
			ToolPanelLocation.Left,
			ToolPanelLocation.Bottom
		],
		
		panels = defaultLocations
			.map(location => ({
				id:ToolPanelLocation[location],
				location
			}))
			.map(({id,location}) => {
				const
					panel = fromPanels[id] || {}
				
				if (panel.tools && !isMap(panel.tools)) {
					panel.tools = Map<string,ITool>(panel.tools)
				}
				
				return _.defaults(panel,{
					id,
					location,
					tools:Map<string,ITool>(),
					toolIds: List<string>(),
					open: false
				})
			})
	
	// ANY NON-STANDARD PANELS ARE RE-ADDED HERE
	Object
		.keys(fromPanels)
		.filter(id => panels.findIndex(it => it && it.id === id) === -1)
		.forEach(id => panels.push(fromPanels[id]))
	
	// REDUCE ALL PANELS TO MAP
	return panels
		.reduce((panelMap:Map<string,IToolPanel>, panel:IToolPanel) => {
			return panelMap.set(panel.id,panel)
		},Map<string,IToolPanel>())
	
}

