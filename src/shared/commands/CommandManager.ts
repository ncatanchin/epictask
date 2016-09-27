



import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand, TCommandContainer, TCommandDefaultAccelerator } from "shared/commands/Command"
import Electron = require('electron')
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { isReactComponent } from "shared/util/UIUtil"
import { inElectron, isMac } from "shared/util/ElectronUtil"
import { CommandAccelerator } from "shared/commands/CommandAccelerator"




const
	log = getLogger(__filename),
	InputTagNames = ['INPUT','SELECT','TEXTAREA'],
	isMain = process.type === 'browser',
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:CommandManager,
		hotInstance:CommandManager
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Command container registration
 */
export interface ICommandContainerRegistration {
	container:TCommandContainer
	element?:HTMLElement
	available:boolean
	focused:boolean
	commands?:ICommand[]
}
	
/**
 * Client to main process
 */
export interface ICommandMenuClient {
	addMenuCommand(cmd:ICommand):void
}

/**
 *
 */
export interface ICommandMenuItemRegistration {
	id:string
	menuItem?:Electron.MenuItem
	mounted:boolean
	enabled:boolean
	cmd:ICommand
	accelerator?:string
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
	 * All current menu item registrations
	 */
	private menuItemRegs:{[commandId:string]:ICommandMenuItemRegistration} = {}
	
	/**
	 * Browser menu commands that were sent to main
	 */
	private browserMenuCommands:ICommand[] = []
	
	/**
	 * All the menu items managed in the main process (only fills in main process)
	 */
	private managedMenuItems:Electron.MenuItem[] = []
	
	
	private removeManagedMenuItem(item:Electron.MenuItem) {
		const
			managedIndex = this.managedMenuItems.findIndex(it => it === item || (it as any).id === (item as any).id)
		
		if (managedIndex > -1)
			this.managedMenuItems.splice(managedIndex,1)
	}
	/**
	 * Get menu item registration
	 *
	 * @param cmd
	 * @param createIfMissing
	 */
	private getMenuItemRegistration(cmd:ICommand,createIfMissing = true) {
		if (!isMain || !inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,cmd.id)
			return null
		}
		
		const
			Electron = require('electron'),
			{Menu,MenuItem} = isMain ? Electron : Electron.remote
			
		let
			reg =  this.menuItemRegs[cmd.id]
		
		if (!reg && createIfMissing) {
			const
				menuItem = new MenuItem({
					label: cmd.name,
					id: cmd.id,
					accelerator: cmd.electronAccelerator,
					click: (event) => {
						log.info(`Menu Execute`)
						cmd.execute(cmd,event)
					}
				})
			
			this.managedMenuItems.push(menuItem)
			
			reg = this.menuItemRegs[cmd.id] = {
				id:cmd.id,
				cmd,
				mounted: false,
				enabled: true,
				
				menuItem
			}
		}
		return reg
	}
	
	
	/**
	 * Add a menu command, if on the renderer it trys to get the
	 * command manager on the main process
	 *
	 * @param commands
	 */
	private mountMenuCommand(...commands:ICommand[]) {
		if (!inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,commands.map(it => it.id))
			return
		}
		
		if (!commands.length)
			return
		
		const
			Electron = require('electron')
		
		if (!isMain) {
			const
				mainGetCommandManager = Electron.remote.getGlobal('getCommandManager') as typeof getCommandManager,
				manager = mainGetCommandManager(),
				mappedCommands = commands
					.filter(cmd => cmd.menuPath)
					.map(cmd => {
						const
							mappedCmd = assign(_.pick(cmd,
								'id',
								'execute',
								'name',
								'description',
								'menuPath',
								'type'),{
								electronAccelerator: new CommandAccelerator(cmd.defaultAccelerator).toElectronAccelerator()
							})
						
						if (!this.browserMenuCommands.find(it => it.id === mappedCmd.id))
							this.browserMenuCommands.push(mappedCmd)
						
						return mappedCmd
					})
			
			log.debug(`Passing mapped commands to main process`,mappedCommands.map(it => it.id))
			manager.mountMenuCommand(...mappedCommands)
			return
		}
		
		
		const
			{Menu,MenuItem} = isMain ? Electron : Electron.remote,
			appMenu = Menu.getApplicationMenu()
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		commands.forEach(cmd => {
			if (!cmd.menuPath) {
				//log.debug(`Called addMenuItem, but no menu path specified`)
				return
			}
			
			const
				itemReg = this.getMenuItemRegistration(cmd)
			
			if (itemReg.mounted) {
				log.debug(`Already mounted item`,itemReg.id)
				return
			}
			
			itemReg.mounted = true
			
			const
				menuPath = cmd.menuPath,
				
				// GET THE MENU END POINT
				menu = menuPath.reduce((currentMenu, nextName) => {
					let
						nextMenuItem = (currentMenu.items || currentMenu).find(it => it.label === nextName)
					
					if (nextMenuItem && nextMenuItem.type !== 'submenu') {
						throw new Error(`Can not add a menu item to a non 'submenu' type element for menu path ${menuPath}, type is ${nextMenuItem.type}`)
					} else if (!nextMenuItem) {
						const
							nextMenu = new Menu()
						
						nextMenuItem = new MenuItem({
							label: nextName,
							type: 'submenu',
							submenu: nextMenu
						})
						
						this.managedMenuItems.push(nextMenuItem)
						
						currentMenu.append ?
							currentMenu.append(nextMenuItem) :
							currentMenu.items.push(nextMenuItem)
						
						
					}
					
					
					return nextMenuItem.submenu
				}, appMenu as any)
			
			// PUSH THE ITEM AND UPDATE
			menu.append ?
				menu.append(itemReg.menuItem) :
				menu.items.push(itemReg)
			
			
		})
		
		// FORCE UPDATE
		log.info(`mounting app menu`)
		const
			newAppMenu = new Menu()
		
		appMenu.items
			.filter(item => item.type !== 'submenu' || (Array.isArray(item.submenu) ? item.submenu.length > 0 : item.submenu.items.length > 0))
			.forEach(item => newAppMenu.append(item))
		
		Menu.setApplicationMenu(newAppMenu)
		//Menu.setApplicationMenu(appMenu)
		
		
	}
	
	/**
	 * Remove menu commands (unmount them)
	 *
	 * @param commandIds
	 */
	private unmountMenuCommand(...commandIds:string[]) {
		log.debug(`Going to try and unmount: `, commandIds)
		
		if (!inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,commandIds)
			return
		}
		
		if (!commandIds.length)
			return
		
		const
			Electron = require('electron')
		
		if (!isMain) {
			const
				mainGetCommandManager = Electron.remote.getGlobal('getCommandManager') as typeof getCommandManager,
				manager = mainGetCommandManager()
				
			log.debug(`Passing mapped commands to  for UNMOUNT`,commandIds)
			manager.unmountMenuCommand(...commandIds)
			return
		}
		
		
		const
			{Menu} = isMain ? Electron : Electron.remote,
			appMenu = Menu.getApplicationMenu(),
			touchedMenus:Electron.Menu[] = []
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		commandIds.forEach(commandId => {
			const
				itemReg = this.menuItemRegs[commandId],
				cmd = itemReg && itemReg.cmd
			
			if (!itemReg || !cmd.menuPath) {
				log.debug(`Called addMenuItem, but no menu path specified`)
				return
			}
			
			if (!itemReg.mounted) {
				log.debug(`Already un-mounted item`,itemReg.id)
				return
			}
			
			itemReg.mounted = false
			
			const
				menuPath = cmd.menuPath,
				
				// GET THE MENU END POINT
				menu = menuPath.reduce((currentMenu, nextName) => {
					if (!currentMenu)
						return null
					
					let
						nextMenuItem = (currentMenu.items || currentMenu).find(it => it.label === nextName)
					
					if (nextMenuItem && nextMenuItem.type !== 'submenu') {
						throw new Error(`Can not add a menu item to a non 'submenu' type element for menu path ${menuPath}, type is ${nextMenuItem.type}`)
					} else if (!nextMenuItem) {
						return null
					}
					
					
					currentMenu = nextMenuItem.submenu
					
					// KEEP TRACK SO WE CAN PRUNE
					touchedMenus.push(currentMenu)
					
					return currentMenu
				}, appMenu as any)
			
			if (!menu) {
				log.debug(`Item is not currently mounted`,cmd.id)
				return
			}
			
			const
				itemIndex = (menu.items || []).findIndex(it => it === itemReg.menuItem || it.id === cmd.id)
			
			// REMOVE THE ITEM
			log.debug(`Found item to remove at index ${itemIndex}`,itemIndex)
			if (itemIndex > -1)
				menu.items.splice(itemIndex,1)
			
		})
		
		
		log.debug(`Checking menus that need to be pruned`,touchedMenus.length)
		
		touchedMenus
			.reverse()
			.forEach(topMenu => {
				
				const
					itemsToRemove = [],
					topItems = (Array.isArray(topMenu) ? topMenu.items : topMenu.items) as Electron.MenuItem[]
				
				topItems
					.forEach(item => {
						if (item && item.submenu) {
							
							const
								{submenu} = item,
								hasItems = Array.isArray(submenu) ? submenu.length > 0 : submenu.items.length > 0
							
							if (!hasItems && this.managedMenuItems.includes(item)) {
								itemsToRemove.push(item)
							}
						}
					})
				
				
				while (itemsToRemove.length) {
					const
						item = itemsToRemove.pop(),
						index = topItems.findIndex(it => it === item || (it as any).id === (item as any).id)
					
					log.debug(`Pruning item`,item.id,index)
					
					if (index > -1 && this.managedMenuItems.includes(item)) {
						this.removeManagedMenuItem(item)
						
						topItems.splice(index,1)
					}
					
				}
			})
		
		// FORCE UPDATE
		const
			newAppMenu = new Menu()

		appMenu.items
			.filter(item => !this.managedMenuItems.includes(item) || item.type !== 'submenu' || (Array.isArray(item.submenu) ? item.submenu.length > 0 : item.submenu.items.length > 0))
			.forEach(item => newAppMenu.append(item))
		
		Menu.setApplicationMenu(newAppMenu)
		
	}
	
	
	
	/**
	 * Map of all currently registered commands
	 */
	private commands:{[commandId:string]:ICommand} = {}
	
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
	
	/**
	 * Retrieve all current commands
	 *
	 * @returns {ICommand[]}
	 */
	allCommands():ICommand[] {
		return Object.values(this.commands)
	}
	
	/**
	 * Handle the key down event
	 *
	 * @param event
	 */
	private handleKeyDown(event:KeyboardEvent) {
		
		const
			containers = this.focusedContainers(),
			isInputTarget = event.target && InputTagNames.includes((event.target as HTMLElement).tagName)
		
		log.debug(`Key down received`, event,`Ordered containers: `, containers.map(it => it.element))
		
		for (let container of containers) {
			
			const
				cmd = container.commands.find(it =>
					CommandAccelerator.matchToEvent(it.defaultAccelerator,event))
			
			if (cmd && (!isInputTarget || cmd.overrideInput)) {
				cmd.execute(cmd,event)
				event.preventDefault()
				event.stopPropagation()
				event.stopImmediatePropagation()
				break
			}
		}
	}
	
	
	/**
	 * On window blur
	 *
	 * @param event
	 */
	private onWindowBlur(event) {
		log.debug('body blur')
		
		
		this.unmountMenuCommand(...this.browserMenuCommands.map(cmd => cmd.id))
		
	}
	
	/**
	 * on window focus
	 *
	 * @param event
	 */
	private onWindowFocus(event) {
		log.debug('body focus')
		
		this.mountMenuCommand(...this.browserMenuCommands)
	}
	
	
	private windowListeners
	
	/**
	 * Attach to event producers
	 */
	attachEventHandlers() {
		if (typeof window !== 'undefined') {
			if (!this.windowListeners) {
				this.windowListeners = {
					keydown: this.handleKeyDown.bind(this),
					focus: this.onWindowFocus.bind(this),
					blur: this.onWindowBlur.bind(this)
				}
				
				
				const
					doc = window.document
				
				Object
					.keys(this.windowListeners)
					.forEach(eventName => {
						const
							listener = this.windowListeners[ eventName ]
						
						if (['keydown'].includes(eventName)) {
							doc.addEventListener(eventName, listener)
						} else {
							if (!isMain && inElectron()) {
								const
									browserWindow = require('electron').remote.getCurrentWindow()
								
								browserWindow.addListener(eventName,listener)
							}
						}
					})
			}
			// doc.body.addEventListener('focus',(event) => log.debug('body focus'))
			// doc.body.addEventListener('blur',(event) => )
		}
	}
	
	/**
	 * Detach event handlers
	 */
	detachEventHandlers() {
		if (this.windowListeners) {
			const
				doc = window.document
			
			Object
				.keys(this.windowListeners)
				.forEach(eventName => {
					const
						listener = this.windowListeners[ eventName ]
					
					if (['keydown'].includes(eventName)) {
						doc.removeEventListener(eventName, listener)
					} else {
						if (!isMain && inElectron()) {
							const
								browserWindow = require('electron').remote.getCurrentWindow()
							
							browserWindow.removeListener(eventName,listener)
						}
					}
					// doc.removeEventListener(eventName,this.windowListeners[eventName])
				})
			
			
			this.windowListeners = null
		}
	}
	
	/**
	 * Get or create container internally
	 *
	 * @param id
	 * @param container
	 * @param available
	 */
	private getContainerStatus(id:string,container:TCommandContainer,available:boolean):ICommandContainerRegistration  {
		let
			status = this.containers[id]
		
		if (!status) {
			status = this.containers[id] = {
				container,
				available,
				focused: false,
				commands: [],
				element: isReactComponent(container) &&
					ReactDOM.findDOMNode(container) as HTMLElement
			}
		} else {
			status.available = available
			if (!available)
				status.focused = false
		}
		
		return status
	}
	
	/**
	 * Load or reload keymaps, commands, etc
	 */
	load() {
		log.info(`Loading commands & keymaps`)
	}
	
	/**
	 * Register a command
	 *
	 * @param id
	 * @param container
	 * @param commands
	 */
	registerContainerCommand(id:string, container:TCommandContainer, ...commands:ICommand[]) {
		commands.forEach(cmd => {
			
			log.debug(`Registering command`,cmd.id)
			
			this.commands[cmd.id] = cmd
		})
		
		const
			status = this.getContainerStatus(id,container,true)
		
		status.commands =
			status
				.commands
				.filter(cmd => !commands.find(it => it.id === cmd.id))
				.concat(commands)
		
		
		log.info(`Mounting menu command`,commands.map(it => it.id))
		this.mountMenuCommand(...commands)
		
		
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
			status = this.getContainerStatus(id,container,false)
		
		status.commands = status.commands.filter(cmd => !commands.find(it => it.id === cmd.id))
		
		log.info(`Unmounting menu command`,...commands.map(it => it.id))
		this.unmountMenuCommand(...commands.map(it => it.id))
		
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
		log.info(`Focused on container ${id}`)
		
		const
			status = this.getContainerStatus(id,container,true)
		
		//TODO: mark others as not focused
		status.focused = focused
		return status
	}
	
	/**
	 * Set container status available/not-available
	 *
	 * @param id
	 * @param container
	 * @param available
	 */
	setContainerStatus(id:string,container:TCommandContainer,available:boolean) {
		return this.getContainerStatus(id,container,available)
	}
	
	/**
	 * Focus on container
	 * @param containerId
	 */
	focusOnContainer(containerId:string) {
		const
			containerReg = this.containers[containerId]
		
		if (DEBUG) {
			assert(containerReg, `Unknown container ${containerId}`)
			assert(containerReg.container && containerReg.element, `only ui containers can be focused, element is not available`)
		}
		
		if (!containerReg || !containerReg.element) {
			log.warn(`No container found for ${containerId}`)
			return
		}
		log.debug(`Focusing on ${containerId}`,containerReg.element)
	  const
		  {element} = containerReg,
		  focusEvent = (window as any).FocusEvent ? new FocusEvent('focus',{
				relatedTarget: element
			}) : document.createEvent("FocusEvent")
		
		element.dispatchEvent(focusEvent)
	}
}


/**
 * Get the command manager from anywhere
 * @type {()=>CommandManager}
 */
export const getCommandManager = getHot(module,'getCommandManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return CommandManager.getInstance()
	}
})) as () => CommandManager


/**
 * Default export is the singleton getter
 */
export default getCommandManager


// REF TYPE FOR GETTER
type getCommandManagerType = typeof getCommandManager

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
 * Update the singleton on HMR reload
 */
if (instanceContainer.hotInstance) {
	log.info(`Reloaded from HMR, we simply replace the prototype and force an update here`)
	
	const
		fromInstance = instanceContainer.hotInstance,
		fromProto = fromInstance && Object.getPrototypeOf(fromInstance)
	
	let
		newProto
	
	if (fromInstance) {
		fromInstance.detachEventHandlers()
		
		Object.setPrototypeOf(fromInstance,CommandManager.prototype)
		
		newProto = Object.getPrototypeOf(fromInstance)
		
		fromInstance.attachEventHandlers()
	}
	
	log.debug(`hot reloading`,fromInstance,fromProto,newProto,'Are protos equal?',newProto === fromProto)
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandManager
}))

acceptHot(module,log)
