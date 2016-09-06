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
export interface ITool {
	/**
	 * Unique string identifying tool
	 */
	id:string
	
	/**
	 * Name of the tool for label & tracking purposes
	 */
	name:string
	
	/**
	 * Optional label value
	 */
	label?:string
	
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