



import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand, TCommandContainer, TCommandDefaultAccelerator } from "shared/commands/Command"
import Electron = require('electron')
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { CommonKeys, GlobalKeys } from "shared/KeyMaps"
import { isNumber, shallowEquals } from "shared/util/ObjectUtil"
import { isReactComponent } from "shared/util/UIUtil"
import { inElectron, isMac } from "shared/util/ElectronUtil"
import _get from 'lodash/get'




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

const
	CommandOrControl = 'CommandOrControl',
	Meta = 'meta',
	Ctrl = 'ctrl',
	Alt = 'alt',
	Shift = 'shift',
	Down = 'ArrowDown',
	Up = 'ArrowUp',
	Right = 'ArrowRight',
	Left = 'ArrowLeft',
	MappedKeys = {
		[CommandOrControl.toLowerCase()]: isMac() ? Meta : Ctrl
	},
	ElectronMappedKeys = {
		[Meta]: 'Super',
		[Ctrl]: 'Control',
		[Alt]: 'Alt',
		[Shift]: 'Shift',
		[Down]: 'Down',
		[Up]: 'Up',
		[Left]: 'Left',
		[Right]: 'Right'
	},
	ModifiedKeyNames = ['ctrl','meta','shift','alt']


function hasOwnProps(o:any,...props:string[]) {
	return o && props.every(prop => o.hasOwnProperty(prop))
}

function isKeyboardEvent(o:any):o is KeyboardEvent {
	return o && (o instanceof KeyboardEvent || (o.type && o.type.indexOf('key') > -1))
}

/**
 * Command accelerator configuration
 */
class CommandAccelerator {
	
	/**
	 * All non modifier key codes
	 */
	codes:string[] = []
	
	/**
	 * Ctrl key
	 */
	ctrlKey:boolean = false
	
	/**
	 * Super key
	 */
	metaKey:boolean = false
	
	/**
	 * Shift key
	 */
	shiftKey:boolean = false
	
	/**
	 * Alt key
	 */
	altKey:boolean = false
	
	
	
	/**
	 * Has any modified
	 */
	get hasModifier() {
		return this.shiftKey || this.ctrlKey || this.metaKey || this.altKey
	}
	
	/**
	 * Has non-input modifier (No shift)
	 */
	get hasNonInputModifier() {
		return this.hasModifier && !this.shiftKey
		
	}
	
	/**
	 * Add another part of the accelerator
	 *
	 * @param code
	 */
	private addPart(code:string) {
		
		if (code) {
			code.toLowerCase()
			
			if (ModifiedKeyNames.includes(code))
				this[`${code}Key`] = true
			else
				this.codes.push(MappedKeys[code] || code)
		}
	}
	
	/**
	 * Create a new accelerator instance
	 *
	 * @param accelerator
	 */
	constructor(
		public accelerator:TCommandDefaultAccelerator|KeyboardEvent
	) {
		if (!accelerator)
			return
		
		// IF KEYBOARD EVENT
		if (isKeyboardEvent(accelerator)) {
			this.addPart(accelerator.code)
			assign(this,_.pick(accelerator,'ctrlKey','altKey','metaKey','shiftKey'))
		} else {
			if (isNumber(accelerator))
				accelerator = GlobalKeys[accelerator]
			
			this.accelerator = accelerator.toLowerCase().replace(/\s/g,'')
			this.accelerator.split('+').forEach(part => this.addPart(part))
		}
	}
	
	/**
	 * Map to electron accelerator string
	 *
	 * @returns {string}
	 */
	toElectronAccelerator():string {
		return !this.codes.length ? '' :this
			.codes
			.map(code => {
				return ElectronMappedKeys[code] || code
			})
			.join('+')
	}
	
	/**
	 * Compare to accelerators
	 *
	 * @param o
	 */
	isEqual(o:CommandAccelerator) {
		return shallowEquals(this,o,'ctrlKey','altKey','metaKey','shiftKey') &&
				this.codes.every(it => o.codes.includes(it))
	}
}

/**
 * Accelerator comparator
 *
 * @param accelerator
 * @param event
 * @returns {any}
 */
function matchAcceleratorToEvent(accelerator:TCommandDefaultAccelerator,event:KeyboardEvent) {
	if (!accelerator || !event)
		return false
	
	const
		accel = new CommandAccelerator(accelerator),
		keyAccel = new CommandAccelerator(event)
	
	return accel.isEqual(keyAccel)
	// if (isNumber(accelerator))
	// 	accelerator = GlobalKeys[accelerator]
	//
	// accelerator = accelerator.toLowerCase().replace(/\s/g,'')
	//
	// const
	// 	parts = accelerator.split('+'),
	// 	eventParts = [],
	// 	addEventPart = (eventPart:string) => eventPart && eventParts.push(eventPart.toLowerCase())
	//
	// addEventPart(event.code)
	// event.ctrlKey && addEventPart('ctrl')
	// event.metaKey && addEventPart('super')
	// event.shiftKey && addEventPart('shift')
	// event.altKey && addEventPart('alt')
	//
	// log.info(`Comparing accel parts`,eventParts,parts)
	// return parts.every(part => eventParts.includes(part))
	
}


/**
 * Command container registration
 */
interface ICommandContainerRegistration {
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
	 * Get menu item registration
	 *
	 * @param cmd
	 * @param createIfMissing
	 */
	private getMenuItemRegistration(cmd:ICommand,createIfMissing = true) {
		if (!isMain || !inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,cmd)
			return null
		}
		
		const
			Electron = require('electron'),
			{Menu,MenuItem} = isMain ? Electron : Electron.remote
			
		let
			reg =  this.menuItemRegs[cmd.id]
		
		if (!reg && createIfMissing) {
			reg = this.menuItemRegs[cmd.id] = {
				id:cmd.id,
				cmd,
				mounted: false,
				enabled: true,
				
				accelerator: cmd.electronAccelerator || new CommandAccelerator(cmd.defaultAccelerator)
					.toElectronAccelerator(),
				
				menuItem: new MenuItem({
					label: cmd.name,
					id: cmd.id,
					click: (event) => {
						log.info(`Menu Execute`)
						cmd.execute(cmd,event)
					}
				})
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
			log.warn(`Not in electron environment, can not add menu item`,commands)
			return
		}
		
		const
			Electron = require('electron')
		
		if (!isMain) {
			const
				mainGetCommandManager = Electron.remote.getGlobal('getCommandManager') as typeof getCommandManager,
				manager = mainGetCommandManager(),
				mappedCommands = commands
					.filter(cmd => cmd.menuPath)
					.map(cmd => {
						return assign(_.pick(cmd,
							'id',
							'execute',
							'name',
							'description',
							'menuPath',
							'type'),{
							electronAccelerator: new CommandAccelerator(cmd.defaultAccelerator).toElectronAccelerator()
						})
					})
			
			log.debug(`Passing mapped commands to main process`,mappedCommands)
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
				log.debug(`Already mounted item`,itemReg)
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
						
						currentMenu.append ?
							currentMenu.append(nextMenuItem) :
							currentMenu.items.push(nextMenuItem)
						
						
					}
					
					
					return nextMenuItem.submenu
				}, appMenu as any)
			
			// PUSH THE ITEM AND UPDATE
			menu.append ? menu.append(itemReg.menuItem) : menu.items.push(itemReg)
			
			
		})
		
		// FORCE UPDATE
		Menu.setApplicationMenu(appMenu)
		
		
	}
	
	/**
	 * Remove menu commands (unmount them)
	 *
	 * @param commands
	 */
	private unmountMenuCommand(...commands:ICommand[]) {
		log.debug(`Going to try and unmount: `, commands)
		
		if (!inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,commands)
			return
		}
		
		const
			Electron = require('electron')
		
		if (!isMain) {
			const
				mainGetCommandManager = Electron.remote.getGlobal('getCommandManager') as typeof getCommandManager,
				manager = mainGetCommandManager(),
				mappedCommands = commands
					.filter(cmd => cmd.menuPath)
					.map(cmd => {
						return _.pick(cmd,
							'id',
							'execute',
							'name',
							'description',
							'menuPath',
							'type')
					})
			
			log.debug(`Passing mapped commands to  for UNMOUNT`,mappedCommands)
			manager.unmountMenuCommand(...mappedCommands)
			return
		}
		
		
		const
			{Menu} = isMain ? Electron : Electron.remote,
			appMenu = Menu.getApplicationMenu(),
			touchedMenus:Electron.Menu[] = [appMenu]
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		commands.forEach(cmd => {
			if (!cmd.menuPath) {
				log.debug(`Called addMenuItem, but no menu path specified`)
				return
			}
			
			const
				itemReg = this.getMenuItemRegistration(cmd,false)
			
			if (!itemReg || !itemReg.mounted) {
				log.info(`Already un-mounted item`,itemReg)
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
				log.debug(`Item is not currently mounted`,cmd)
				return
			}
			
			const
				itemIndex = (menu.items || []).findIndex(it => it === itemReg.menuItem || it.id === cmd.id)
			
			// REMOVE THE ITEM
			log.debug(`Found item to remove at index ${itemIndex}`,itemIndex)
			if (itemIndex > -1)
				menu.items.splice(itemIndex,1)
			
		})
		
		
		log.debug(`Checking menus that need to be pruned`,touchedMenus)
		let
			changes = false
		
		touchedMenus.reverse().forEach(topMenu => {
			const
				itemsToRemove = [],
				topItems = (Array.isArray(topMenu) ? topMenu.items : topMenu.items) as Electron.MenuItem[]
			
			topItems
				.forEach(item => {
					if (item && item.submenu) {
						
						const
							{submenu} = item,
							hasItems = Array.isArray(submenu) ? submenu.length > 0 : submenu.items.length > 0
						
						if (!hasItems) {
							itemsToRemove.push(item)
						}
					}
				})
			
			
			while (itemsToRemove.length) {
				const
					item = itemsToRemove.pop(),
					index = topItems.findIndex(it => it === item || (it as any).id === (item as any).id)
				
				log.debug(`Pruning item`,item,index)
				if (index > -1) {
					topItems.splice(index,1)
				}
				
			}
			
			// if (!changes)
			// 	changes = itemsToRemove.length > 0
			//
			// if (itemsToRemove.length) {
			// 	// const
			// 	// 	newSubMenu = new Menu()
			//
			// 	const
			// 		submenu = topItem.submenu as any,
			// 		goodItems = topItems
			// 			.filter(item => !itemsToRemove.includes(item) && !itemsToRemove.find(it => item === it || (it as any).id === (item as any).id))
			//
			//
			// 	submenu.clear()
			// 	goodItems.forEach(item => submenu.append(item))
			// 	// submenu.
			// 	// if (submenu.clear) {
			// 	//
			// 	// }// = newSubMenu
			//
			// }
			
		})
		
		// if (changes) {
		// 	const
		// 		appMenuItems = appMenu as any,
		// 		itemsToRemove = appMenu.items
		// 			.filter(item => item.submenu && (Array.isArray(item.submenu) ? !item.submenu.length : !item.submenu.items.length))
		//
		// 	//appMenuItems.clear()
		// 	//goodItems.forEach(item => appMenu.append(item))
		//
		// 	while (itemsToRemove.length) {
		// 		const
		// 			item = itemsToRemove.pop(),
		// 			index = appMenu.items.findIndex(it => it === item || (it as any).id === (item as any).id)
		//
		// 		log.debug(`Pruning item`,item,index)
		// 		if (index > -1) {
		// 			appMenu.items.splice(index,1)
		// 		}
		//
		// 	}
		//
			// FORCE UPDATE
		const
			newAppMenu = new Menu()
		
		newAppMenu.items = appMenu.items
		//Menu.setApplicationMenu(appMenu)
		Menu.setApplicationMenu(newAppMenu)
		//}
		
		
		
		// setImmediate(() => {
		//
		// })
		
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
		
		
		// event.stopImmediatePropagation()
		// event.stopPropagation()
		// event.preventDefault()
		// event.cancelBubble = true
		
		const
			containers = this.focusedContainers(),
			isInputTarget = event.target && InputTagNames.includes((event.target as HTMLElement).tagName)
		
		log.debug(`Key down received`, event,`Ordered containers: `, containers.map(it => it.element))
		
		
		
		for (let container of containers) {
			const
				cmd = container.commands.find(it => matchAcceleratorToEvent(it.defaultAccelerator,event))
				
			
			if (cmd && (!isInputTarget || cmd.overrideInput)) {
				cmd.execute(cmd,event)
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
		
		this.unmountMenuCommand(...Object.values(this.menuItemRegs).map(it => it.cmd))
		
	}
	
	/**
	 * on window focus
	 *
	 * @param event
	 */
	private onWindowFocus(event) {
		log.debug('body focus')
		
		this.mountMenuCommand(...Object.values(this.menuItemRegs).map(it => it.cmd))
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
			
			log.debug(`Registering command`,cmd)
			
			this.commands[cmd.id] = cmd
		})
		
		const
			status = this.getContainerStatus(id,container,true)
		
		status.commands =
			status
				.commands
				.filter(cmd => !commands.find(it => it.id === cmd.id))
				.concat(commands)
		
		
		log.info(`Mounting menu command`,commands)
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
			log.debug(`Removing command`,cmd)
			delete this.commands[cmd.id]
		})
		
		const
			status = this.getContainerStatus(id,container,false)
		
		status.commands = status.commands.filter(cmd => !commands.find(it => it.id === cmd.id))
		
		log.info(`Unmounting menu command`,...commands)
		this.unmountMenuCommand(...commands)
		
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
