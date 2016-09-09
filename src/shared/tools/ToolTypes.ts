
import React from 'react'
import {Map} from 'immutable'

const log = getLogger(__filename)

/**
 * Tool panel location
 */
export enum ToolPanelLocation {
	Left = 1,
	Right = 2,
	Bottom = 3,
	Popup = 4
}

/**
 * Map of tools by id
 */
export type TToolMap = {[id:string]:ITool}

/**
 * Denotes an available tool in the system
 */
export interface IToolConfig {
	/**
	 * Unique string identifying tool
	 */
	readonly id:string
	
	/**
	 * Optional label value
	 */
	readonly label:string
	
	/**
	 * Optional gutter button label
	 */
	readonly buttonLabel?:string
	
	/**
	 * Default tool location
	 */
	readonly defaultLocation?:ToolPanelLocation
}

/**
 * Tool Registration
 */
export interface IToolRegistration extends IToolConfig {
	getHeaderControls?: () => React.ReactElement<any>[]
}


/**
 * Tool Shape w/State Info
 */
export interface ITool extends IToolConfig {
	
	/**
	 * Set/Get active status
	 */
	active:boolean
	
	/**
	 * Any extra data
	 */
	data?:any
}



/**
 * Tool Panel Status
 */
export interface IToolPanel {
	id:string
	location:ToolPanelLocation
	tools:{[toolId:string]:ITool}
	open:boolean
	isDefault?:boolean
	data?:any
}

/**
 * Base props for Tool Component
 */
export interface IToolProps extends React.HTMLAttributes {
	tool:ITool
	visible:boolean
	panel:IToolPanel
}

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
		tools: {},
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
	const defaultLocations = [
		ToolPanelLocation.Right,
		ToolPanelLocation.Left,
		ToolPanelLocation.Bottom
	]
	
	const panels = defaultLocations
		.map(location => ({id:ToolPanelLocation[location],location}))
		.map(({id,location}) => {
			const panel = fromPanels[id]
			if (panel) {
				log.debug(`Loading existing panel`,panel)
				return panel
			}
			
			return {
				id,
				location,
				tools:{},
				open: false
			}
		})
	
	Object
		.keys(fromPanels)
		.filter(id => !Object.keys(panels).includes(id))
		.forEach(id => panels[id] = fromPanels[id])
	
	return Object
		.values(panels)
		.reduce((panelMap:Map<string,IToolPanel>, panel:IToolPanel) => {
			return panelMap.set(panel.id,panel)
		},Map<string,IToolPanel>())
	
}