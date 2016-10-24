import Electron = require('electron')

import * as React from 'react'
import * as ReactDOM from 'react-dom'


import { getHot, setDataOnHotDispose, acceptHot } from  "epic-common"

import {
	ICommand, TCommandContainer, CommandType, ICommandMenuManagerProvider,
	ICommandMenuManager, ICommandMenuItem
} from  "epic-command-manager"


import { isReactComponent } from  "epic-common"
import { CommandAccelerator } from  "./CommandAccelerator"

import { isMain, InputTagNames, isElectron } from  "./CommandManagerConfig"

import {
	addWindowListener, addBrowserWindowListener,
	removeBrowserWindowListener, removeWindowListener,
	getCommandBrowserWindow
} from  "./CommandManagerUtil"
import { getValue, cloneObject } from  "epic-common"




const
	log = getLogger(__filename),
	
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof CommandManager,
		instance:CommandManager,
		hotInstance:CommandManager
	}

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Command container registration
 */
export interface ICommandContainerRegistration {
	container:TCommandContainer
	element?:HTMLElement
	available:boolean
	focused:boolean
	commands?:ICommand[]
	menuItems?:ICommandMenuItem[]
}

 

/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class CommandManager {
	
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new CommandManager()
		
		return instanceContainer.instance
	}
	
	
	/**
	 * Menu Manager Provider
	 */
	private menuManagerProvider:ICommandMenuManagerProvider
	
	/**
	 * Browser menu commands that were sent to main
	 */
	private menuItems:ICommandMenuItem[] = []
	
	
	/**
	 * Global command list
	 */
	private globalCommands:{[id:string]:{
		id:string,
		electronAccelerator:string,
		registered:boolean,
		conflict:boolean,
		cmd:ICommand
	}} = {}
	
	/**
	 * Map of all currently registered commands
	 */
	private commands:{[commandId:string]:ICommand} = {}
	
	
	/**
	 * Window & document listeners
	 */
	private windowListeners
	
	/**
	 * Browser window listeners for electronm
	 */
	private browserListeners
	
	
	
	
	
	
	
	
	/**
	 * Map of all current containers
	 */
	private containers:{[containerId:string]:ICommandContainerRegistration} = {}
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		this.attachEventHandlers()
		this.load()
		
	}
	
	/**
	 * All Focused Containers
	 */
	private focusedContainers():ICommandContainerRegistration[] {
		return Object
			.values(this.containers)
			.filter(it => it.focused && it.element)
			.sort((c1,c2) =>
				c1.element.contains(c2.element) ? 1 :
			  c2.element.contains(c1.element) ? -1 : 0)
	}
	
	private executeMenuItem(item:ICommandMenuItem,event:any = null) {
		const
			cmd = item.commandId && this.getCommand(item.commandId)
		
		cmd && cmd.execute(cmd,event)
		
	}
	
	private makeExecuteMenuItem(item:ICommandMenuItem) {
		return (event) => this.executeMenuItem(item,event)
	}
	
	/**
	 * Get the menu manager from the configured provider
	 *
	 * @returns {ICommandMenuManager}
	 */
	getMenuManager():ICommandMenuManager {
		return getValue(() => this.menuManagerProvider(),null)
	}
	
	/**
	 * Set the menu manager provider
	 *
	 * @param menuManagerProvider
	 */
	setMenuManagerProvider(menuManagerProvider:ICommandMenuManagerProvider) {
		this.menuManagerProvider = menuManagerProvider
	}
	
	/**
	 * Get a command by id
	 *
	 * @param commandId
	 * @returns {ICommand}
	 */
	getCommand(commandId:string) {
		let
			cmd = this.commands[commandId]
		
		if (!cmd) {
			cmd = Object.values(this.commands).find(it => it.name && it.name.endsWith(commandId) || it.id.endsWith(commandId))
		}
		
		return cmd
	}
	
	/**
	 * Retrieve all current commands
	 *
	 * @returns {ICommand[]}
	 */
	allCommands():ICommand[] {
		return Object.values(this.commands)
			.filter(cmd => cmd.hideInAllCommands !== true && cmd.hidden !== true)
	}
	
	/**
	 * Find a matching command and accelerator
	 *
	 * @param commands
	 * @param event
	 * @returns {[ICommand,CommandAccelerator]}
	 */
	private matchAcceleratorAndCommand(commands:ICommand[],event):[ICommand,CommandAccelerator] {
		for (let cmd of commands) {
			if (CommandAccelerator.matchToEvent(cmd.defaultAccelerator,event)) {
				return [cmd,new CommandAccelerator(event)]
			}
		}
		return null
	}
	
	/**
	 * Handle the key down event
	 *
	 * @param event
	 * @param fromInputOverride - for md editing really
	 */
	handleKeyDown(event:KeyboardEvent,fromInputOverride = false) {
		
		const
			containers = this.focusedContainers(),
			isInputTarget =
				(event.target && InputTagNames.includes((event.target as HTMLElement).tagName)) ||
				fromInputOverride
		
		log.debug(`Key down received`, event,`Ordered containers: `, containers.map(it => it.element))
		
		for (let container of containers) {
			
			const
				match = this.matchAcceleratorAndCommand(container.commands,event)
			if (match) {
				const
					[cmd,accel] = match
				
				
				if (cmd && (!isInputTarget || cmd.overrideInput || accel.hasNonInputModifier)) {
					cmd.execute(cmd, event)
					event.preventDefault()
					event.stopPropagation()
					event.stopImmediatePropagation()
					break
				}
			}
		}
	}
	
	
	/**
	 * Focus event for any component
	 *
	 * @param event
	 */
	private handleFocus(event:FocusEvent) {
		log.debug(`focus received`,event)
	}
	
	/**
	 * Blur event for any component
	 *
	 * @param event
	 */
	private handleBlur(event:FocusEvent) {
		log.debug(`blur received`,event)
	}
	
	/**
	 * Before unload - UNBIND - EVERYTHING
	 *
	 * @param event
	 */
	private unload(event) {
		log.debug(`Unloading all commands`)
		this.unmountCommand(...Object.values(this.commands))
	}
	
	/**
	 * On window blur
	 *
	 * @param event
	 */
	private onWindowBlur(event) {
		this.unmountMenuItems(...this.menuItems.filter(item => item.mountsWithContainer))
	}
		
	/**
	 * on window focus
	 *
	 * @param event
	 */
	private onWindowFocus(event) {
		this.mountMenuItems(...this.menuItems)
	}
	
	
	/**
	 * Attach to event producers
	 */
	attachEventHandlers() {
		if (typeof window !== 'undefined') {
			if (!this.windowListeners) {
				this.windowListeners = {
					focus: {
						listener: this.handleFocus.bind(this)
					},
					blur: {
						listener: this.handleBlur.bind(this)
					},
					keydown: {
						listener: this.handleKeyDown.bind(this)
					},
					unload: {
						listener: this.unload.bind(this)
					}
					
				}
				
				this.browserListeners = {
					focus: {
						listener:this.onWindowFocus.bind(this),
						attacher: addBrowserWindowListener,
						detacher: removeBrowserWindowListener
					},
					blur: {
						listener: this.onWindowBlur.bind(this),
						attacher: addBrowserWindowListener,
						detacher: removeBrowserWindowListener
					}
				}
				
				
				Object
					.keys(this.windowListeners)
					.forEach(eventName => {
						addWindowListener(eventName,this.windowListeners[eventName].listener)
					})
				
				Object
					.keys(this.browserListeners)
					.forEach(eventName => {
						addBrowserWindowListener(eventName,this.browserListeners[eventName].listener)
					})
			}
		}
	}
	
	/**
	 * Detach event handlers
	 */
	detachEventHandlers() {
		if (this.windowListeners) {
			log.debug(`Detaching window listeners`)
			
			
			Object
				.keys(this.windowListeners)
				.forEach(eventName => {
					removeWindowListener(eventName,this.windowListeners[eventName].listener)
				})
			
			Object
				.keys(this.browserListeners)
				.forEach(eventName => {
					removeBrowserWindowListener(eventName,this.browserListeners[eventName].listener)
				})
			
			this.windowListeners = null
			this.browserListeners = null
		}
	}
	
	/**
	 * Get or create container internally
	 *
	 * @param id
	 * @param container
	 * @param available
	 */
	private getContainerRegistration(id:string, container:TCommandContainer, available:boolean):ICommandContainerRegistration  {
		let
			reg = this.containers[id]
		
		if (!reg) {
			reg = this.containers[id] = {
				container,
				available,
				focused: false,
				commands: [],
				menuItems: [],
				element: isReactComponent(container) &&
					ReactDOM.findDOMNode(container) as HTMLElement
			}
		} else {
			reg.available = available
			if (!available)
				reg.focused = false
		}
		
		return reg
	}
	
	/**
	 * Load or reload keymaps, commands, etc
	 */
	load() {
		log.debug(`Loading commands & keymaps`)
	}
	
	/**
	 * Map a menu command
	 *
	 * @param item
	 * @returns {any}
	 */
	private mapMenuItem = (item:ICommandMenuItem) => {
		return cloneObject(item,item.execute && {
			execute: this.makeExecuteMenuItem(item)
		})
	}
	
	/**
	 * Add/Update menu commands
	 *
	 * @param items
	 */
	private addMenuItem(...items:ICommandMenuItem[]) {
		this.menuItems =
			this.menuItems
				.filter(it => !items.find(item => item.id === it.id))
				.concat(items.map(this.mapMenuItem))
		
	}
	
	/**
	 * Get all menu items in a list of commands
	 *
	 * @param commands
	 * @returns {ICommandMenuItem[]}
	 */
	private getMenuItemsFromCommands(...commands:ICommand[]):ICommandMenuItem[] {
		return commands
			.filter(cmd => cmd.menuItem)
			.map(cmd => cmd.menuItem)
	}
	
	
	/**
	 * Remove a global shortcut
	 *
	 * @param commands
	 */
	removeGlobalShortcut(...commands:ICommand[]) {
		if (!isElectron)
			return
		
		if (!commands.length) {
			log.info(`No global shortcut commands provided, so removing all`)
			commands = Object.values(this.globalCommands)
		}
		
		const
			globalShortcut = getValue(() => Electron.remote.globalShortcut) || Electron.globalShortcut
		
		commands
			.filter(it => it.type === CommandType.Global)
			.forEach(it => {
				const
					shortcut = this.globalCommands[it.id]
				
				if (!shortcut) {
					log.debug(`No short cut for command`,it)
					return
				}
				
				log.debug(`Removing global shortcut: ${it.id}`)
				globalShortcut.unregister(shortcut.electronAccelerator)
				delete this.globalCommands[it.id]
			})
	}
	
	
	/**
	 * Update global shortcuts
	 *
	 * @param commands
	 */
	private updateGlobalCommands(commands:ICommand[]) {
		const
			globalShortcut = getValue(() => Electron.remote.globalShortcut) || Electron.globalShortcut
		
		commands
			.filter(it => it.type === CommandType.Global)
			.forEach(it => {
				if (this.globalCommands[it.id]) {
					log.debug('un-registering global shortcut first',it)
					this.removeGlobalShortcut(it)
				}
				
				const
					electronAccelerator =
						new CommandAccelerator(it.defaultAccelerator).toElectronAccelerator(),
					
					shortcut = this.globalCommands[it.id] = {
						id: it.id,
						cmd: it,
						electronAccelerator,
						registered: false,
						conflict: globalShortcut.isRegistered(electronAccelerator)
					}
					
				log.debug(`Registering shortcut`,shortcut)
				const
					result = shortcut.registered = (globalShortcut.register(electronAccelerator,() => {
						log.debug(`Executing global shortcut`, shortcut)
						shortcut.cmd.execute(shortcut.cmd)
					})) as any
				
				log.debug(`Command was registered success=${result}`)
					
			})
	}
	
	/**
	 * A guarded menu manager command
	 *
	 * @param fn
	 */
	private menuManagerFn(fn:(menuManager:ICommandMenuManager) => any) {
		const
			menuManager = this.getMenuManager()
		
		if (menuManager) {
			fn(menuManager)
		}
	}
	
	/**
	 * Update menu commands
	 *
	 * @param items
	 * @param force
	 */
	private updateMenuItems(items:ICommandMenuItem[], force = false) {
		this.addMenuItem(...items)
		this.menuManagerFn((menuManager) => menuManager.updateItem(...items))
		
		// LOOK FOR CHANGES
		// let
		// 	changes = force
		//
		// if (!changes) {
		// 	for (let cmd of mappedCommands) {
		// 		if (!shallowEquals(cmd, this.menuItems.find(it => it.id === cmd.id))) {
		// 			changes = true
		// 			changedCommands.push(cmd)
		// 		}
		// 	}
		// }
		
		//if (changes) {
		
		//}
	}
	
	/**
	 * Remove a set of menu commands
	 *
	 * @param items
	 */
	private removeMenuItems(items:ICommandMenuItem[]) {
		
		for (let item of items) {
			const
				index = this.menuItems
					.findIndex(it => it.id === item.id)
			
			if (index > -1) {
				this.menuItems.splice(index,1)
			}
		}
		
		this.menuManagerFn(manager => manager.removeItem(...items))
	}
	
	
	/**
	 * Mount all menu commands
	 *
	 * @param items
	 */
	private mountMenuItems(...items:ICommandMenuItem[]) {
		if (getCommandBrowserWindow() && !getCommandBrowserWindow().isFocused())
			return
		
		this.menuManagerFn(manager => manager.showItem(...items))
	}
	
	/**
	 * Unmount a set of menu commands on the main process
	 *
	 * @param items
	 */
	private unmountMenuItems(...items:ICommandMenuItem[]) {
		const
			menuItemIds = items.map(it => it.id)
		
		log.debug(`Unmounting menu command`,...menuItemIds)
		
		this.menuManagerFn(manager => manager.hideItem(...menuItemIds))
		
		
	}
	
	/**
	 * Register commands globally
	 *
	 * @param commands
	 */
	private mountCommand(...commands:ICommand[]) {
		this.mountMenuItems(...this.getMenuItemsFromCommands(commands))
		
		
		
	}
	
	/**
	 * Unmount a set of commands
	 *
	 * @param commands
	 */
	private unmountCommand(...commands:ICommand[]) {
		this.unmountMenuItems(...this.getMenuItemsFromCommands(commands))
	}
	
	/**
	 * Create a command updater
	 *
	 * @param cmd
	 * @returns {(patch:any)=>undefined}
	 */
	private makeCommandUpdater(cmd:ICommand) {
		return (patch) => {
			const
				patchedCmd = _.assign(_.clone(cmd),patch)
			
			this.registerItems([patchedCmd],[])
		}
	}
	
	/**
	 * Register commands
	 *
	 * @param commands
	 * @param menuItems
	 */
	registerItems(commands:ICommand[], menuItems:ICommandMenuItem[]) {
		const
			windowId = process.env.EPIC_WINDOW_ID && process.env.EPIC_WINDOW_ID !== 'undefined' ? process.env.EPIC_WINDOW_ID : null,
			expandId = (id:string) => {
				if (windowId && id.indexOf(`${windowId}-`) !== 0) {
					id = `${windowId}-${id}`
				}
				return id
			},
			ensureValidId = (cmdOrMenuItem:ICommand|ICommandMenuItem) => {
				cmdOrMenuItem.id = expandId(cmdOrMenuItem.id)
			}
		
		commands.forEach(cmd => {
			cmd.id = cmd.id || cmd.name
			assert(cmd.id,`A command can not be registered without an id & name`)
			
			ensureValidId(cmd)
			
			// ADD OR UPDATE
			const
				currentCmd = this.commands[cmd.id]
			
			if (currentCmd) {
				cmd = Object.assign(currentCmd,cmd)
			} else {
				this.commands[cmd.id] = cmd
			}
			
			// IF AN UPDATE MANAGER IS PROVIDED THEN SEND AN UPDATER
			if (cmd.updateManager) {
				const
					cmdUpdater = this.makeCommandUpdater(cmd)
				
				cmd.updateManager(cmd, {
					setHidden: (hidden:boolean) =>
						cmdUpdater({ hidden })
					,
					
					setEnabled: (enabled:boolean) =>
						cmdUpdater({ enabled })
					,
					update: (newCmd:ICommand) =>
						cmdUpdater(newCmd)
				})
			}
		})
		
		const
			allMenuItems:ICommandMenuItem[] = (menuItems || []).concat(this.getMenuItemsFromCommands(commands))
		
		allMenuItems.forEach(item => {
			assert(item.id || item.label,`Menu ID or label is required`)
			ensureValidId(item)
		})
		
		// FINALLY UPDATE MENU ITEMS
		log.debug(`Mounting menu command`,allMenuItems.map(it => it.id))
		this.updateMenuItems(allMenuItems)
		this.updateGlobalCommands(commands)
	}
	
	/**
	 * Un-register commands
	 *
	 * @param commands
	 * @param menuItems
	 */
	unregisterItems(commands:ICommand[],menuItems:ICommandMenuItem[]) {
		commands.forEach(cmd => {
			delete this.commands[cmd.id]
		})
		
		// FINALLY MAKE SURE MENU ITEMS ARE REMOVED
		this.removeMenuItems(this.getAllMenuItems(commands,menuItems))
	}
	
	/**
	 * Get all menu items from commands and
	 * base menu items
	 *
	 * @param commands
	 * @param menuItems
	 */
	private getAllMenuItems(commands:ICommand[],menuItems:ICommandMenuItem[]):ICommandMenuItem[] {
		return _.uniqBy(this.getMenuItemsFromCommands(commands).concat(menuItems),'id')
	}
	
	/**
	 * Register a command
	 *
	 * @param id
	 * @param container
	 * @param commands
	 * @param menuItems
	 */
	registerContainerItems(id:string, container:TCommandContainer,commands:ICommand[],menuItems:ICommandMenuItem[]) {
		
		this.registerItems(commands,menuItems)
		
		const
			reg = this.getContainerRegistration(id,container,true)
		
		// UPDATE COMMANDS ON CONTAINER REG
		reg.commands =
			reg
				.commands
				.filter(cmd => !commands.find(it => it.id === cmd.id))
				.concat(commands)
		
		const
			allMenuItems = this.getAllMenuItems(commands,menuItems)
		
		reg.menuItems =
			reg
				.menuItems
				.filter(item => !allMenuItems.find(it => it.id === item.id))
				.concat(allMenuItems)
		
		
		
	}
	
	/**
	 * Unregister commands
	 *
	 * @param id
	 * @param container
	 * @param commands
	 */
	unregisterContainerCommand(id:string, container:TCommandContainer, ...commands:ICommand[]) {
		commands.forEach(cmd => {
			log.debug(`Removing command`,cmd.id)
			delete this.commands[cmd.id]
		})
		
		const
			reg = this.getContainerRegistration(id,container,false)
		
		//status.commands = status.commands.filter(cmd => !commands.find(it => it.id === cmd.id))
		this.unregisterItems(reg.commands,reg.menuItems)
	}
	
	
	/**
	 * Set container as focused
	 *
	 * @param id
	 * @param container
	 * @param focused
	 * @param event
	 * @returns {ICommandContainerRegistration}
	 */
	setContainerFocused(id:string,container:TCommandContainer,focused:boolean, event:React.FocusEvent<any> = null) {
		log.debug(`Focused on container ${id}`)
		
		const
			status = this.getContainerRegistration(id,container,true),
			{commands} = status
		
		//TODO: mark others as not focused
		status.focused = focused
		
		if (commands) {
			if (focused) {
				this.mountCommand(...commands)
			} else {
				const
					containerCommands = commands.filter(it => it.type === CommandType.Container)
				
				// ONLY UNMOUNT CONTAINER COMMANDS
				this.unmountCommand(...containerCommands)
			}
		}
		
		return status
	}
	
	/**
	 * Set container status available/not-available
	 *
	 * @param id
	 * @param container
	 * @param available
	 */
	setContainerMounted(id:string, container:TCommandContainer, available:boolean) {
		const
			reg = this.getContainerRegistration(id,container,available)
		
		if (getValue(() => reg.commands.length,0) || getValue(() => reg.menuItems.length,0)) {
			if (available) {
				this.registerItems(reg.commands,reg.menuItems)
			} else {
				this.unregisterItems(reg.commands,reg.menuItems)
			}
		}
		
		return reg
	}
	
	/**
	 * Focus on container
	 * @param containerId
	 * @param skipEvent
	 */
	focusOnContainer(containerId:string, skipEvent = false) {
		const
			containerReg = this.containers[containerId]
		
		// if (DEBUG) {
		// 	assert(containerReg, `Unknown container ${containerId}`)
		// 	assert(containerReg.container && containerReg.element, `only ui containers can be focused, element is not available`)
		// }
		
		if (!containerReg || !containerReg.element) {
			log.warn(`No container found for ${containerId}`)
			return
		}
		
		
		const
			doFocus = () => {
				const
					{element} = containerReg
				
				// log.debug(`Focusing on ${containerId}`, element)
				// const
				// 	focusEvent = (window as any).FocusEvent ? new FocusEvent('focus', {
				// 		relatedTarget: element
				// 	}) : document.createEvent("FocusEvent")
				//
				// element.dispatchEvent(focusEvent)
				$('#issuesPanel').focus()
			}
		
		doFocus()
		// if (skipEvent) {
		//
		// } else if (document.activeElement) {
		// 	$(document.activeElement).blur()
		// 	setTimeout(doFocus,150)
		// } else
		// 	doFocus()
	}
}


/**
 * Get the command manager from anywhere
 * @type {()=>CommandManager}
 */
export const getCommandManager = getHot(module,'getCommandManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => CommandManager


// ADD REMOVE GLOBAL SHORTCUTS
if (isElectron) {
	const
		removeShortcuts = () => getCommandManager().removeGlobalShortcut()
	
	if (isMain) {
		Electron.app.on('will-quit',() => {
			removeShortcuts()
			Electron.globalShortcut.unregisterAll()
		})
	} else {
		Electron.remote.getCurrentWindow().on('close',removeShortcuts)
	}
}

/**
 * Default export is the singleton getter
 */
export default getCommandManager


// REF TYPE FOR GETTER
export type getCommandManagerType = typeof getCommandManager

/**
 * Add getCommandManager onto the global scope
 */
assignGlobal({getCommandManager})

/**
 * getCommandManager global declaration
 */
declare global {
	const getCommandManager:getCommandManagerType
}



/**
 * Update the singleton on HMR reload & set root clazz
 */
instanceContainer.clazz = CommandManager

if (instanceContainer.hotInstance) {
	instanceContainer.hotInstance.detachEventHandlers()
	Object.setPrototypeOf(instanceContainer.hotInstance,CommandManager.prototype)
	instanceContainer.hotInstance.attachEventHandlers()
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandManager
}))

acceptHot(module,log)
