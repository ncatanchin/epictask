// HMR
import { getHot, setDataOnHotDispose, acceptHot } from  "epic-global"
import { inElectron,shallowEquals } from  "epic-global"

import {ICommandMenuManager, ICommandMenuItem} from './Command'
import { getCommandManagerType, getCommandManager } from  "./CommandManager"
import { isMain } from  "./CommandManagerConfig"

import Electron = require('electron')


const
	log = getLogger(__filename),
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof CommandElectronMenuManager,
		instance:CommandElectronMenuManager,
		hotInstance:CommandElectronMenuManager
	}

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
	mountMenu?:Electron.Menu
	mountIndex?:number
	item:ICommandMenuItem
	accelerator?:string
}
	
/**
 * Manage Electron Main Menu
 */
export class CommandElectronMenuManager implements ICommandMenuManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new CommandElectronMenuManager()
		
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
		item.visible = false
	}
	
	
	
	
	/**
	 * Create a new menu item from a command
	 *
	 * @param item
	 */
	private makeMenuItem(item:ICommandMenuItem) {
		const
			{MenuItem} = Electron
		
		return new MenuItem({
			label: item.label,
			id: item.id,
			enabled: item.enabled,
			visible: item.hidden !== true,
			click: (event) => {
				log.info(`Menu Execute`,item)
				item && item.execute && item.execute(item,event)
			}
		})
	}
	
	/**
	 * Get menu item registration
	 *
	 * @param item
	 * @param createIfMissing
	 */
	private getMenuItemRegistration(item:ICommandMenuItem,createIfMissing = true) {
		if (!isMain || !inElectron()) {
			log.warn(`Not in electron environment, can not add menu item`,item.id)
			return null
		}
		
		const
			{Menu,MenuItem} = Electron
		
		let
			reg =  this.menuItemRegs[item.id]
		
		if (!reg && createIfMissing) {
			const
				menuItem = this.makeMenuItem(item)
			
			this.menuItems.push(menuItem)
			
			reg = this.menuItemRegs[item.id] = {
				id:item.id,
				item,
				mounted: false,
				menuItem
			}
		}
		return reg
	}
	
	/**
	 * Update menu commands
	 *
	 * @param items
	 */
	updateItem(...items:ICommandMenuItem[]) {
		setImmediate(() => {
			items.forEach(item => {
				const
					itemReg = this.getMenuItemRegistration(item),
					{mounted} = itemReg
				
				// CHECK FOR SIMPLE CHANGES
				if (mounted) {
					
					// NO CHANGES
					if (shallowEquals(itemReg.item,item)) {
						log.debug(`No menu changes at all`)
						return
					}
					
					// VISIBILITY OR ENABLED CHANGE ONLY
					else if (shallowEquals(itemReg.item,item,'label','electronAccelerator')) {
						const
							updates = {
								enabled: item.enabled,
								visible: item.hidden !== true
							}
						
						Object.assign(itemReg.item, updates,{
							execute: item.execute
						})
						
						Object.assign(itemReg.menuItem, updates)
						
						return
					}
				}
				
				// // UNMOUNT & REMOVE EXISTING ITEM
				const
					oldMenuItem = itemReg.menuItem,
					newMenuItem = this.makeMenuItem(item)
				
				oldMenuItem.enabled = false
				oldMenuItem.visible = false
				
				// if (mounted)
				// 	this.internalRemoveCommand(itemReg.cmd)
				//
				// this.removeMenuItem(itemReg.menuItem)

				// UPDATE AND CREATE NEW ITEM
				Object.assign(itemReg,{
					item,
					menuItem: newMenuItem
				})
				
				//this.menuItems.push(itemReg.menuItem)
				
				if (itemReg.mountMenu) {
					itemReg.mountMenu.items[itemReg.mountIndex] = itemReg.menuItem
				}

				// SHOW UPDATE
				if (mounted)
					this.internalShowItem(item)
				
			})
		})
		
	}
	
	/**
	 * Internal remove command
	 *
	 * @param items
	 */
	private internalRemoveItem(...items:ICommandMenuItem[]) {
		this.internalHideItem(...items.map(it => it.id))
		
		items.forEach(item => {
			const
				itemReg = this.menuItemRegs[item.id]
			
			if (itemReg && itemReg.menuItem) {
				this.removeMenuItem(itemReg.menuItem)
			}
			
			//delete this.menuItemRegs[cmd.id]
		})
	}
	
	/**
	 * Remove commands
	 *
	 * @param items
	 */
	removeItem(...items:ICommandMenuItem[]) {
		setImmediate(() => {
			this.internalRemoveItem(...items)
		})
		
		
	}
	
	/**
	 * Internal show commands function
	 *
	 * @param items
	 */
	internalShowItem(...items:ICommandMenuItem[]) {
		if (!items.length)
			return
		
		const
			{ Menu, MenuItem } = Electron,
			appMenu = Menu.getApplicationMenu()
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		items.forEach(item => {
			if (!item.menuPath) {
				return
			}
			
			const
				itemReg = this.getMenuItemRegistration(item)
			
			if (itemReg.mounted) {
				log.debug(`Already mounted item`, itemReg.id)
				return
			}
			
			itemReg.mounted = true
			
			const
				menuPath = item.menuPath,
				
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
					
					if (!nextMenuItem.visible)
						nextMenuItem.visible = true
					
					
					return nextMenuItem.submenu
				}, appMenu as any)
			
			// PUSH THE ITEM AND UPDATE
			if (!itemReg.menuItem.visible) {
				itemReg.menuItem.visible = true
			} else {
				itemReg.mountMenu = menu
				itemReg.mountIndex = menu.items.length
				
				menu.append ?
					menu.append(itemReg.menuItem) :
					menu.items.push(itemReg.menuItem)
			}
			
			 
			
		})
		
		// FORCE UPDATE
		const
			newAppMenu = new Menu()
		
		appMenu.items
			.filter(item => item.type !== 'submenu' || menuHasItems(item.submenu))
			.forEach(item => newAppMenu.append(item))
		
		Menu.setApplicationMenu(newAppMenu)
	}
	
	/**
	 * Add a menu command, if on the renderer it trys to get the
	 * command manager on the main process
	 *
	 * @param items
	 */
	showItem(...items:ICommandMenuItem[]) {
		setImmediate(() => {
			this.internalShowItem(...items)
		})
	}
	
	
	/**
	 * Internal hide command - actually hides commands
	 *
	 * @param itemIds
	 */
	private internalHideItem(...itemIds) {
		log.debug(`Going to try and unmount: `, itemIds)
		
		if (!itemIds.length)
			return
		
		const
			{Menu,MenuItem} = Electron,
			appMenu = Menu.getApplicationMenu(),
			touchedMenus:Electron.Menu[] = []
		
		let
			changes = false
		
		//ITERATE COMMANDS AND ADD WHENEVER NEEDED
		itemIds.forEach(itemId => {
			const
				itemReg = this.menuItemRegs[itemId],
				item = itemReg && itemReg.item
			
			if (!itemReg || !item.menuPath || !itemReg.mounted || !itemReg.menuItem.visible) {
				log.debug(`Called addMenuItem, not registered or not mounted or no menu path or already hidden`)
				return
			}
			
			itemReg.menuItem.visible = false
			changes = true
			
			// MARK AS NOT MOUNTED
			itemReg.mounted = false
		})
		
		// IF NO CHANGES - RETURN
		if (!changes) {
			log.debug(`No commands hidden`)
			return
		}
		
		log.debug(`Checking menus that need to be pruned`,touchedMenus.length)
		
		// ITERATE ALL TOUCHED MENUS IN REVERSE ORDER
		// FIND EMPTY SUB-MENUS AND REMOVE THEM
		try {
			const hideEmptyChildren = (checkMenu) => {
				let
					items = Array.isArray(checkMenu) ? checkMenu : checkMenu.items
				
				items
					.forEach((item:Electron.MenuItem,index) => {
						if (item.submenu) {
							
							
							// //noinspection JSPrimitiveTypeWrapperUsage
							const
								subItems:Electron.MenuItem[] = (Array.isArray(item.submenu) ? item.submenu : item.submenu.items) as any
							
							hideEmptyChildren(subItems)
							if (subItems.every(subItem => !subItem.visible)) {
								item.visible = false
							}
						}
					})
			}
			
			hideEmptyChildren(appMenu)
			
		} catch (err) {
			log.error(`Failed to remove menu items`, err)
			throw err
		}
		
	}
	
	/**
	 * Remove menu commands (unmount them)
	 *
	 * @param itemIds
	 */
	hideItem(...itemIds:string[]) {
		setImmediate(() => {
			this.internalHideItem(...itemIds)
		})
	}
	
	
	
}



/**
 * Get the command main menu manager from anywhere
 */
export const getCommandElectronMenuManager = getHot(module,'getCommandElectronMenuManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => CommandElectronMenuManager


/**
 * Default export is the singleton getter
 */
export default getCommandElectronMenuManager



/**
 * Get the command manager on the main process
 *
 * @returns {CommandManager}
 */
function getMainCommandManager() {
	return (isMain ? getCommandManager() :
		(require('electron').remote.getGlobal('getCommandManager') as getCommandManagerType)())
}

/**
 * Return the main process menu manager
 *
 * @returns {any}
 */

export const ElectronMainManagerProvider = () => {
	return 	(isMain) ?
		getCommandElectronMenuManager() :
		getMainCommandManager().getMenuManager()
}



// REF TYPE FOR GETTER
export type getCommandElectronMenuManagerType = typeof getCommandElectronMenuManager

/**
 * Add getCommandManager onto the global scope
 */
if (DEBUG)
	assignGlobal({getCommandElectronMenuManager})


instanceContainer.clazz = CommandElectronMenuManager

/**
 * Update the singleton on HMR reload
 */
if (instanceContainer.hotInstance) {
	Object.setPrototypeOf(
		instanceContainer.hotInstance,
		CommandElectronMenuManager.prototype
	)
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandElectronMenuManager
}))

acceptHot(module,log)
