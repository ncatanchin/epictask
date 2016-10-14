

import { CommonKeys } from "shared/KeyMaps"
import { isNil, isNumber, isString } from "shared/util/ObjectUtil"

const
	log = getLogger(__filename)



export type TCommandDefaultAccelerator = string|CommonKeys|any


/**
 * ALl command types
 */
export enum CommandType {
	/**
	 * Registers a global shortcut in electron apps
	 */
	Global,
		
	/**
	 * App-Wide
	 */
	App,
		
	/**
	 * Container or selector based
	 */
	Container
}

export type TCommandContainer = React.Component<any, any>|Electron.Menu


/**
 * Command updater set on registration
 */
export interface ICommandUpdater {
	setEnabled:(enabled:boolean) => any
	setHidden:(hidden:boolean) => any
	update:(cmd:ICommand) => any
}


/**
 * Executor shape
 */
export type TCommandExecutor = (command:ICommand,event?:any) => any



/**
 * Command shape
 */
export interface ICommand {
	/**
	 * Unique identifier for command
	 */
	id?:string
	
	/**
	 * Global, App or Regular command
	 */
	type?:CommandType
	
	/**
	 * React Component
	 */
	container?:React.Component<any,any>|Electron.Menu
	
	/**
	 * Execute the command, takes no args aside from the command
	 *
	 * @param command
	 */
	execute?:TCommandExecutor
	
	/**
	 * Holder for electron accel
	 */
	electronAccelerator?:string
	
	/**
	 * Electron styled accelerator (converted to mousetrap in browser window)
	 *
	 * if false, an accelerator can not be assigned
	 *
	 * @see https://github.com/electron/electron/blob/master/docs/api/accelerator.md
	 */
	defaultAccelerator?:TCommandDefaultAccelerator
	
	
	/**
	 * Accelerator currently configured
	 */
	accelerator?:TCommandDefaultAccelerator
	
	/**
	 * If the command does not have a modifier and an input/select/textarea
	 * has focus, unless overrideInput is true, the command is not triggered
	 */
	overrideInput?:boolean
	
	/**
	 * The visible name or label
	 */
	name?:string
	
	/**
	 * Optional extended info
	 */
	description?:string
	
	/**
	 * if not specified - assumes should show
	 */
	hidden?:boolean
	
	/**
	 * Hide in allCommands result
	 */
	hideInAllCommands?:boolean
	
	/**
	 * Current action is enabled
	 */
	enabled?:boolean
	
	/**
	 * Path to the menu where this should be added
	 */
	menuItem?:ICommandMenuItem
	
	/**
	 * if hidden disabled is assumed, but this prop
	 * overrides all
	 */
	disableKeyReassign?:boolean
	
	/**
	 * A function that accepts and updater for making changes to registered commands
	 *
	 * @param updater
	 */
	updateManager?:(cmd:ICommand,updater:ICommandUpdater) => any
}


/**
 * Default Implementation of Command, any things that fits the shape can be used
 */
export class Command implements ICommand {
	
	
	id:string
	container:TCommandContainer
	defaultAccelerator:TCommandDefaultAccelerator
	overrideInput:boolean = false
	hidden:boolean = false
	menuItem:ICommandMenuItem
	disableKeyReassign:boolean
	
	/**
	 * Create a command from a command object - anything that implements the interface
	 *
	 * @param command
	 */
	constructor(command:ICommand)
	
	/**
	 * Create a command with required values
	 *
	 * @param id
	 * @param type
	 * @param execute
	 * @param name
	 * @param description
	 */
	constructor(id:string,type:CommandType,execute:TCommandExecutor, name?:string,description?:string)
	constructor(idOrCommand:string|ICommand = null,public type:CommandType = null,public execute:TCommandExecutor = null,public name:string = null,public description:string = null) {
		if (isString(idOrCommand)) {
			this.id = idOrCommand
		} else if (idOrCommand) {
			assign(this, idOrCommand)
		}
		
		assign(this,{
			disableKeyReassign: !isNil(this.disableKeyReassign) ? this.disableKeyReassign : !!this.hidden,
		})
		
		
	}
}



/**
 * Command menu item type
 */
export enum CommandMenuItemType {
	Submenu = 1,
	Command,
	Separator,
	Checkbox
}

/**
 * Executor shape
 */
export type TCommandMenuItemExecutor = (menuItem:ICommandMenuItem,event?:any) => any

/**
 * Command menu item
 */
export interface ICommandMenuItem {
	
	/**
	 * Menu item id
	 */
	id?:string
	
	iconUrl?:string
	
	type?:CommandMenuItemType
	
	subItems?:ICommandMenuItem[]
	
	isSubItem?:boolean
	
	mountsWithContainer?:boolean
	
	label?:string
	
	subLabel?:string
	
	enabled?:boolean
	
	hidden?:boolean
	
	electronAccelerator?:TCommandDefaultAccelerator
	
	defaultAccelerator?:TCommandDefaultAccelerator
	
	accelerator?:TCommandDefaultAccelerator
	
	menuPath?:string[]
	
	/**
	 * Execute the item, takes no args aside from the command
	 *
	 * @param command
	 */
	execute?:TCommandMenuItemExecutor
}


export interface ICommandMenuManager {
	
	
	
	/**
	 * Update menu items
	 *
	 * @param menuItems
	 */
	updateItem(...menuItems:ICommandMenuItem[]):void
	
	/**
	 * Remove items
	 *
	 * @param menuItems
	 */
	removeItem(...menuItems:ICommandMenuItem[]):void
	
	
	/**
	 * Show items
	 *
	 * @param menuItems
	 */
	showItem(...menuItems:ICommandMenuItem[]):void
	
	
	/**
	 * Hide items
	 *
	 * @param menuItemIds
	 */
	hideItem(...menuItemIds:string[]):void
}


/**
 * Provider interface
 */
export interface ICommandMenuManagerProvider {
	():ICommandMenuManager
}