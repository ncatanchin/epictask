
import { getHot, setDataOnHotDispose, acceptHot } from  "epic-common"
import { ICommandMenuManager, ICommandMenuItem, CommandMenuItemType } from  "./Command"
import { getValue, cloneObject } from  "epic-common"
import { EnumEventEmitter } from  "epic-common"
import { OrderedMap } from "immutable"

const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof CommandSimpleMenuManager,
		instance:CommandSimpleMenuManager,
		hotInstance:CommandSimpleMenuManager
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)

export enum CommandSimpleMenuManagerEventType {
	MenuChanged = 1
}

/**
 * Manage Electron Main Menu
 */
export class CommandSimpleMenuManager extends EnumEventEmitter<CommandSimpleMenuManagerEventType> implements ICommandMenuManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new CommandSimpleMenuManager()
		
		return instanceContainer.instance
	}
	
	
	/**
	 * Create a main menu manager (only should occur on main process)
	 */
	private constructor() {
		super(CommandSimpleMenuManagerEventType)
	}
	
	/**
	 * All current menu item registrations
	 */
	private menuItems:OrderedMap<string,ICommandMenuItem> =
		OrderedMap<string,ICommandMenuItem>().asMutable()
	
	/**
	 * Root items
	 */
	private rootItems:ICommandMenuItem[] = []
	
	
	/**
	 * Get the current root items
	 *
	 * @returns {ICommandMenuItem[]}
	 */
	getRootItems() {
		return this.rootItems
	}
	
	/**
	 * Rebuild the rootMenuItems
	 */
	private rebuild() {
		const
			menuItems = this.menuItems.valueSeq().toJS(),
			items:ICommandMenuItem[] = cloneObject(menuItems),
			
			rootItems = [],
			
			// FIND PARENT OF ITEM
			findParent = (menuPath:string[] = []) => {
				let
					parentItem:ICommandMenuItem = null
				
				const
					makeSubMenu = (label:string) => ({
						id: label,
						label,
						type: CommandMenuItemType.Menu,
						subItems: []
					})
			
				
				menuPath.forEach(part => {
					let
						subItems = !parentItem ?
							rootItems :
							parentItem.subItems
					
					if (!subItems)
						subItems = parentItem.subItems = []
					
					let
						nextParent = subItems.find(item => item.id === part || item.label === part)
					
					if (!nextParent) {
						nextParent = makeSubMenu(part)
					}
					
					subItems.push(nextParent)
					
					parentItem = nextParent
				})
				
				return parentItem
			}
		
			
		// CREATE & MAP ALL ITEMS
		items
			.forEach(item => {
				
				const
					
					// FIND THE PARENT
					parentItem =
						getValue(() =>
							item.menuPath.length, 0
						) &&
						findParent(item.menuPath),
					
					// FIND SUB ITEMS
					parentItems = getValue(() => parentItem.subItems, rootItems)
				
				// PUSH THIS ITEM TO THE LIST
				parentItems.push(item)
				
				//if (item.subItems)
					// item.subItems = item
					// 	.subItems
					// 	.filter(item =>
					// 		this.menuItems[item.id] &&
					// 		this.menuItems[item.id].hidden !== true
					// 	)
			})
		
		this.rootItems = rootItems
		this.emit(CommandSimpleMenuManagerEventType.MenuChanged,rootItems)
	}
	
	/**
	 * Update menu commands
	 *
	 * @param items
	 */
	updateItem(...items:ICommandMenuItem[]) {
		const
			addItem = (item) => {
				this.menuItems.set(item.id,  cloneObject(item))
			}
			
		items.forEach(addItem)
		this.rebuild()
	}
	
	/**
	 * Remove commands
	 *
	 * @param items
	 */
	removeItem(...items:ICommandMenuItem[]) {
		items.forEach(item => this.menuItems.remove(item.id))
		
		this.rebuild()
	}
	
	
	/**
	 * Add a menu command, if on the renderer it trys to get the
	 * command manager on the main process
	 *
	 * @param items
	 */
	showItem(...items:ICommandMenuItem[]) {
		items.forEach(item => {
			item.hidden = false
		})
		
		this.updateItem(...items)
		
	}
	
	
	/**
	 * Remove menu commands (unmount them)
	 *
	 * @param itemIds
	 */
	hideItem(...itemIds:string[]) {
		const
			items = this
				.menuItems
				.valueSeq()
				.filter(item => item && itemIds.includes(item.id))
		
		items.forEach(item => {
			this.menuItems.set(item.id,cloneObject(item, {
				hidden: true
			}))
		})
		
		this.rebuild()
	}
	
	
	
}



/**
 * Get the command main menu manager from anywhere
 */
export const getCommandSimpleMenuManager = getHot(module,'getCommandSimpleMenuManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => CommandSimpleMenuManager


/**
 * Default export is the singleton getter
 */
export default getCommandSimpleMenuManager



/**
 * Return the main process menu manager
 *
 * @returns {CommandSimpleMenuManager}
 */

export const SimpleMenuManagerProvider = getCommandSimpleMenuManager


// REF TYPE FOR GETTER
export type getCommandSimpleMenuManagerType = typeof getCommandSimpleMenuManager


/**
 * Add getCommandManager onto the global scope
 */
if (DEBUG)
	assignGlobal({getCommandSimpleMenuManager})


instanceContainer.clazz = CommandSimpleMenuManager

/**
 * Update the singleton on HMR reload
 */
if (instanceContainer.hotInstance) {
	Object.setPrototypeOf(
		instanceContainer.hotInstance,
		CommandSimpleMenuManager.prototype
	)
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandSimpleMenuManager
}))

acceptHot(module,log)
