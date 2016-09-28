
import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand } from "shared/commands/Command"
import { inElectron } from "shared/util/ElectronUtil"
import { isMain } from "shared/commands/CommandManagerConfig"
import { shallowEquals } from "shared/util/ObjectUtil"


const
	log = getLogger(__filename),
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof CommandMainMenuManager,
		instance:CommandMainMenuManager,
		hotInstance:CommandMainMenuManager
	},
	Electron = inElectron && require('electron')

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)
	
	
/**
 * Determine if a menu or item list has items
 *
 * @param menu
 * @returns {boolean}
 */
function menuHasItems(menu:Electron.Menu|Electron.MenuItem[]|any[]) {
	return Array.isArray(menu) ? menu.length > 0 : menu.items.length > 0
}
	
/**
 *
 */
export interface ICommandMenuItemRegistration {
	id:string
	menuItem?:Electron.MenuItem
	mounted:boolean
	cmd:ICommand
	accelerator?:string
}
	
/**
 * Manage Electron Main Menu
 */
export class CommandMainMenuManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new CommandMainMenuManager()
		
		return instanceContainer.instance
	}
	
	
	/**
	 * Create a main menu manager (only should occur on main process)
	 */
	private constructor() {
		
	}
	
	/**
	 * All the menu items managed in the
	 * main process (only fills in main process)
	 */
	private menuItems:Electron.MenuItem[] = []
	
	/**
	 * All current menu item registrations
	 */
	private menuItemRegs:{[commandId:string]:ICommandMenuItemRegistration} = {}
	
	
	/**
	 * Remove menu item
	 *
	 * @param item
	 */
	private removeMenuItem(item:Electron.MenuItem) {
		const
			managedIndex = this.menuItems.findIndex(it => it === item || (it as any).id === (item as any).id)
		
		if (managedIndex > -1)
			this.menuItems.splice(managedIndex,1)
	}
	
	/**
	 * Create a new menu item from a command
	 *
	 * @param cmd
	 */
	private makeMenuItem(cmd:ICommand) {
		const
			{MenuItem} = Electron
		
		return new MenuItem({
			label: cmd.name,
			id: cmd.id,
			enabled: cmd.enabled,
			visible: cmd.hidden !== true,
			accelerator: cmd.electronAccelerator,
			click: (event) => {
				log.info(`Menu Execute`,cmd)
				cmd.execute(cmd,event)
			}
		})
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
			{Menu,MenuItem} = Electron
		
		let
			reg =  this.menuItemRegs[cmd.id]
		
		if (!reg && createIfMissing) {
			const
				menuItem = this.makeMenuItem(cmd)
			
			this.menuItems.push(menuItem)
			
			reg = this.menuItemRegs[cmd.id] = {
				id:cmd.id,
				cmd,
				mounted: false,
				menuItem
			}
		}
		return reg
	}
	
	/**
	 * Update menu commands
	 *
	 * @param commands
	 */
	updateCommand(...commands:ICommand[]) {
		setImmediate(() => {
			commands.forEach(cmd => {
				const
					itemReg = this.getMenuItemRegistration(cmd),
					{mounted} = itemReg
				
				// CHECK FOR SIMPLE CHANGES
				if (mounted) {
					
					// NO CHANGES
					if (shallowEquals(itemReg.cmd,cmd)) {
						log.debug(`No menu changes at all`)
						return
					}
					
					// VISIBILITY OR ENABLED CHANGE ONLY
					else if (shallowEquals(itemReg.cmd,cmd,'label','electronAccelerator')) {
						const
							updates = {
								enabled: cmd.enabled,
								visible: cmd.hidden !== true
							}
						
						Object.assign(itemReg.cmd, updates,{
							execute: cmd.execute
						})
						
						Object.assign(itemReg.menuItem, updates)
						
						return
					}
				}
				
				// UNMOUNT & REMOVE EXISTING ITEM
				if (mounted)
					this.removeCommand(itemReg.cmd)
				
				this.removeMenuItem(itemReg.menuItem)
				
				// UPDATE AND CREATE NEW ITEM
				Object.assign(itemReg,{
					cmd,
					menuItem: this.makeMenuItem(cmd)
				})
				
				this.menuItems.push(itemReg.menuItem)
				
				
				// SHOW UPDATE
				this.showCommand(cmd)
				
			})
		})
		
	}
	
	/**
	 * Remove commands
	 *
	 * @param commands
	 */
	removeCommand(...commands:ICommand[]) {
		setImmediate(() => {
			this.hideCommand(...commands.map(it => it.id))
			
			commands.forEach(cmd => {
				const
					itemReg = this.menuItemRegs[cmd.id]
				
				if (itemReg && itemReg.menuItem) {
					this.removeMenuItem(itemReg.menuItem)
				}
				
				delete this.menuItemRegs[cmd.id]
			})
		})
		
		
	}
	
	/**
	 * Add a menu command, if on the renderer it trys to get the
	 * command manager on the main process
	 *
	 * @param commands
	 */
	showCommand(...commands:ICommand[]) {
		setImmediate(() => {
			if (!commands.length)
				return
			
			const
				{ Menu, MenuItem } = Electron,
				appMenu = Menu.getApplicationMenu()
			
			//ITERATE COMMANDS AND ADD WHENEVER NEEDED
			commands.forEach(cmd => {
				if (!cmd.menuPath) {
					return
				}
				
				const
					itemReg = this.getMenuItemRegistration(cmd)
				
				if (itemReg.mounted) {
					log.debug(`Already mounted item`, itemReg.id)
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
							
							this.menuItems.push(nextMenuItem)
							
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
			const
				newAppMenu = new Menu()
			
			appMenu.items
				.filter(item => item.type !== 'submenu' || menuHasItems(item.submenu))
				.forEach(item => newAppMenu.append(item))
			
			Menu.setApplicationMenu(newAppMenu)
		})
	}
	
	
	
	/**
	 * Remove menu commands (unmount them)
	 *
	 * @param commandIds
	 */
	hideCommand(...commandIds:string[]) {
		log.debug(`Going to try and unmount: `, commandIds)
		
		if (!commandIds.length)
			return
		
		const
			{Menu} = Electron,
			appMenu = Menu.getApplicationMenu(),
			touchedMenus:Electron.Menu[] = []
		
		let
			changes = false
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		commandIds.forEach(commandId => {
			const
				itemReg = this.menuItemRegs[commandId],
				cmd = itemReg && itemReg.cmd
			
			if (!itemReg || !cmd.menuPath || !itemReg.mounted) {
				log.debug(`Called addMenuItem, not registered or not mounted or no menu path`)
				return
			}
			
			
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
			
			// IF NO MENU FOUND - RETURN
			if (!menu) {
				log.debug(`Item is not currently mounted`,cmd.id)
				return
			}
			
			// MARK AS NOT MOUNTED
			itemReg.mounted = false
			
			const
				itemIndex = (menu.items || []).findIndex(it => it === itemReg.menuItem || it.id === cmd.id)
			
			// REMOVE THE ITEM
			log.debug(`Found item to remove at index ${itemIndex}`,itemIndex)
			if (itemIndex > -1) {
				changes = true
				menu.items.splice(itemIndex, 1)
			}
		})
		
		// IF NO CHANGES - RETURN
		if (!changes) {
			log.debug(`No commands hidden`)
			return
		}
		
		log.debug(`Checking menus that need to be pruned`,touchedMenus.length)
		
		// ITERATE ALL TOUCHED MENUS IN REVERSE ORDER
		// FIND EMPTY SUB-MENUS AND REMOVE THEM
		touchedMenus
			.reverse()
			.forEach(topMenu => {
				
				const
					itemsToRemove = [],
					topItems = (Array.isArray(topMenu) ? topMenu.items : topMenu.items) as Electron.MenuItem[]
				
				topItems
					.filter(item => item && item.submenu)
					.forEach(item => {
						const
							{submenu} = item,
							hasItems = menuHasItems(submenu)
						
						if (!hasItems && this.menuItems.includes(item)) {
							itemsToRemove.push(item)
						}
					})
				
				// IF EMPTIES FIND, PRUNE THEN 1 by 1
				while (itemsToRemove.length) {
					const
						item = itemsToRemove.pop(),
						index = topItems.findIndex(it => it === item || (it as any).id === (item as any).id)
					
					log.debug(`Pruning item`,item.id,index)
					
					if (index > -1 && this.menuItems.includes(item)) {
						this.removeMenuItem(item)
						
						topItems.splice(index,1)
					}
					
				}
			})
		
		// FORCE UPDATE
		const
			newAppMenu = new Menu()
		
		appMenu.items
			.filter(item => !this.menuItems.includes(item) || item.type !== 'submenu' || (Array.isArray(item.submenu) ? item.submenu.length > 0 : item.submenu.items.length > 0))
			.forEach(item => newAppMenu.append(item))
		
		Menu.setApplicationMenu(newAppMenu)
		
	}
	
	
	
}



/**
 * Get the command main menu manager from anywhere
 */
export const getCommandMainMenuManager = getHot(module,'getCommandMainMenuManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => CommandMainMenuManager


/**
 * Default export is the singleton getter
 */
export default getCommandMainMenuManager


// REF TYPE FOR GETTER
export type getCommandMainMenuManagerType = typeof getCommandMainMenuManager

/**
 * Add getCommandManager onto the global scope
 */
if (DEBUG)
	assignGlobal({getCommandMainMenuManager})


instanceContainer.clazz = CommandMainMenuManager

/**
 * Update the singleton on HMR reload
 */
if (instanceContainer.hotInstance) {
	Object.setPrototypeOf(instanceContainer.hotInstance,CommandMainMenuManager.prototype)
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandMainMenuManager
}))

acceptHot(module,log)
