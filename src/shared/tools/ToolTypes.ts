
import React from 'react'

/**
 * Tool panel location
 */
export enum ToolPanelLocation {
	Left = 1,
	Right = 2,
	Bottom = 3,
	Window = 4
}



/**
 * Denotes an available tool in the system
 */
export interface IToolConfig {
	/**
	 * Unique string identifying tool
	 */
	readonly id:string
	
	/**
	 * Name of the tool for label & tracking purposes
	 */
	readonly name:string
	
	/**
	 * Optional label value
	 */
	readonly label?:string
	
	/**
	 * Default tool location
	 */
	readonly defaultLocation?:ToolPanelLocation
}


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
	tools:ITool[]
	open:boolean
	isDefault?:boolean
	data?:any
}

/**
 * Base props for Tool Component
 */
export interface IToolProps extends React.HTMLAttributes {
	config:IToolConfig
	visible:boolean
}