



import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand, TCommandContainer, CommandType } from "shared/commands/Command"
import Electron = require('electron')
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { isReactComponent } from "shared/util/UIUtil"

import { CommandAccelerator } from "shared/commands/CommandAccelerator"
import { isMain, InputTagNames, isElectron } from "shared/commands/CommandManagerConfig"
import { getCommandMainMenuManagerType, CommandMainMenuManager } from "shared/commands/CommandMainMenuManager"
import {
	addWindowListener, addBrowserWindowListener,
	removeBrowserWindowListener, removeWindowListener,
	getCommandBrowserWindow
} from "shared/commands/CommandManagerUtil"
import { shallowEquals } from "shared/util/ObjectUtil"




const
	log = getLogger(__filename),
	
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof CommandManager,
		instance:CommandManager,
		hotInstance:CommandManager,
		
		mainManager:CommandManager
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)


	

/**
 * Get the command manager on the main process
 *
 * @returns {CommandManager}
 */
function getMainCommandManager() {
	if (instanceContainer.mainManager)
		return instanceContainer.mainManager
	
	return (instanceContainer.mainManager = (isMain ? getCommandManager() :
			(require('electron').remote.getGlobal('getCommandManager') as getCommandManagerType)()))
}

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
 * The command manager - menu, shortcuts, containers, etc
 */
export class CommandManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new CommandManager()
		
		return instanceContainer.instance
	}
	
	/**
	 * Return the main process menu manager
	 *
	 * @returns {any}
	 */
	private getMainMenuManager() {
		return 	(isMain) ?
				(require('./CommandMainMenuManager').getCommandMainMenuManager as getCommandMainMenuManagerType)() :
				getMainCommandManager().getMainMenuManager()
	}
	
	private mainMenuManager = new Proxy({},{
		get: (target,prop) => {
			return (...args) => {
				try {
					const
						manager = this.getMainMenuManager(),
						fn = manager && manager[prop]
					
					
					if (!fn) {
						return log.debug(`Prop ${prop} not available on main menu manager`)
					}
					if (typeof fn !== 'function') {
						return log.warn(`Prop ${prop} is NOT a function`)
					}
					
					fn(...args)
				} catch (err) {
					log.error(`Error occurred calling main menu`,err)
					throw err
				}
			}
		}
	}) as CommandMainMenuManager
	
	/**
	 * Browser menu commands that were sent to main
	 */
	private menuCommands:ICommand[] = []
	
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
	private beforeUnload(event) {
		log.debug(`Unloading all commands`)
		this.unmountCommand(...Object.values(this.commands))
	}
	
	/**
	 * On window blur
	 *
	 * @param event
	 */
	private onWindowBlur(event) {
		this.unmountMenuCommand(...this.menuCommands.filter(cmd => cmd.type === CommandType.Container))
	}
		
	/**
	 * on window focus
	 *
	 * @param event
	 */
	private onWindowFocus(event) {
		this.mountMenuCommand(...this.menuCommands)
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
					beforeunload: {
						listener: this.beforeUnload.bind(this)
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
	 * @param cmd
	 * @returns {any}
	 */
	private mapMenuCommand = (cmd:ICommand) => {
		return assign(_.pick(cmd,
			'id',
			'execute',
			'name',
			'description',
			'enabled',
			'hidden',
			'menuPath',
			'type'),{
			electronAccelerator: cmd.electronAccelerator || new CommandAccelerator(cmd.defaultAccelerator).toElectronAccelerator()
		})
	}
	
	/**
	 * Add/Update menu commands
	 *
	 * @param commands
	 */
	private addMenuCommand(...commands:ICommand[]) {
		this.menuCommands =
			this.menuCommands
				.filter(it => !commands.find(cmd => cmd.id === it.id))
				.concat(commands.map(this.mapMenuCommand))
		
	}
	
	/**
	 * Map commands to electron menu commands
	 *
	 * @param commands
	 * @returns {any[]}
	 */
	private getMenuCommands(...commands:ICommand[]) {
		return commands
			.filter(cmd => cmd.menuPath)
			.map(cmd => {
				const
					mappedCmd = this.mapMenuCommand(cmd)
				
				this.addMenuCommand(mappedCmd)
				
				return mappedCmd
			})
	}
	
	/**
	 * Update menu commands
	 *
	 * @param commands
	 * @param force
	 */
	private updateMenuCommands(commands:ICommand[],force = false) {
		const
			mappedCommands = commands
				.filter(it => it.menuPath)
				.map(this.mapMenuCommand),
			changedCommands = force ? mappedCommands : []
			
		// LOOK FOR CHANGES
		let
			changes = force
		
		if (!changes) {
			for (let cmd of mappedCommands) {
				if (!shallowEquals(cmd, this.menuCommands.find(it => it.id === cmd.id))) {
					changes = true
					changedCommands.push(cmd)
				}
			}
		}
		
		if (changes) {
			this.addMenuCommand(...changedCommands)
		  this.mainMenuManager.updateCommand(...changedCommands)
		}
	}
	
	/**
	 * Remove a set of menu commands
	 *
	 * @param commands
	 */
	private removeMenuCommands(commands:ICommand[]) {
		
		commands = commands
			.filter(it => it.menuPath)
		
		for (let cmd of commands) {
			const
				index = this.menuCommands
					.findIndex(it => it.id === cmd.id)
			
			if (index > -1) {
				this.menuCommands.splice(index,1)
			}
		}
		
		this.mainMenuManager.removeCommand(...commands)
	}
	
	
	/**
	 * Mount all menu commands
	 *
	 * @param commands
	 */
	private mountMenuCommand(...commands:ICommand[]) {
		if (getCommandBrowserWindow() && !getCommandBrowserWindow().isFocused())
			return
		
		const
			manager = this.mainMenuManager,
			menuCommands = this.getMenuCommands(...commands)
		
		manager.showCommand(...menuCommands)
	}
	
	/**
	 * Unmount a set of menu commands on the main process
	 *
	 * @param commands
	 */
	private unmountMenuCommand(...commands:ICommand[]) {
		const
			manager = this.mainMenuManager,
			menuCommandIds = commands
				.filter(it => it.menuPath)
				.map(it => it.id)
		
		log.debug(`Unmounting menu command`,...menuCommandIds)
		manager.hideCommand(...menuCommandIds)
		
	}
	
	/**
	 * Register commands globally
	 *
	 * @param commands
	 */
	private mountCommand(...commands:ICommand[]) {
		this.mountMenuCommand(...commands)
		
		
		
	}
	
	/**
	 * Unmount a set of commands
	 *
	 * @param commands
	 */
	private unmountCommand(...commands:ICommand[]) {
		this.unmountMenuCommand(...commands)
	}
	
	
	
	/**
	 * Register commands
	 *
	 * @param commands
	 */
	registerCommand(...commands:ICommand[]) {
		const
			windowId = process.env.EPIC_WINDOW_ID && process.env.EPIC_WINDOW_ID !== 'undefined' ? process.env.EPIC_WINDOW_ID : null
		
		commands.forEach(cmd => {
			assert(cmd.id && cmd.name,`A command can not be registered without an id & name`)
			
			if (windowId && cmd.id.indexOf(`${windowId}-`) !== 0) {
				cmd.id = `${windowId}-${cmd.id}`
			}
			
			// ADD OR UPDATE
			const
				currentCmd = this.commands[cmd.id]
			
			if (currentCmd) {
				cmd = Object.assign(currentCmd,cmd)
			} else {
				this.commands[cmd.id] = cmd
			}
			
			// IF AN UPDATE MANAGER IS PROVIDED THEN SEND AN UPDATER
			if (cmd.updateManager)
				cmd.updateManager(cmd,{
					setHidden:(hidden:boolean) =>
						this.registerCommand(Object.assign(cmd,{hidden})),
					setEnabled:(enabled:boolean) =>
						this.registerCommand(Object.assign(cmd,{enabled})),
					update:(cmd:ICommand) => this.registerCommand(cmd)
				})
		})
		// FINALLY UPDATE MENU ITEMS
		log.debug(`Mounting menu command`,commands.map(it => it.id))
		this.updateMenuCommands(commands)
	}
	
	/**
	 * Un-register commands
	 *
	 * @param commands
	 */
	unregisterCommand(...commands:ICommand[]) {
		commands.forEach(cmd => {
			delete this.commands[cmd.id]
		})
		
		// FINALLY MAKE SURE MENU ITEMS ARE REMOVED
		this.removeMenuCommands(commands)
	}
	
	/**
	 * Register a command
	 *
	 * @param id
	 * @param container
	 * @param commands
	 */
	registerContainerCommand(id:string, container:TCommandContainer, ...commands:ICommand[]) {
		
		this.registerCommand(...commands)
		
		const
			reg = this.getContainerRegistration(id,container,true)
		
		// UPDATE COMMANDS ON CONTAINER REG
		reg.commands =
			reg
				.commands
				.filter(cmd => !commands.find(it => it.id === cmd.id))
				.concat(commands)
		
		
		
		
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
		this.unregisterCommand(...reg.commands)
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
		
		if (reg.commands) {
			if (available) {
				this.registerCommand(...reg.commands)
			} else {
				this.unregisterCommand(...reg.commands)
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
				
				log.debug(`Focusing on ${containerId}`, element)
				const
					focusEvent = (window as any).FocusEvent ? new FocusEvent('focus', {
						relatedTarget: element
					}) : document.createEvent("FocusEvent")
				
				element.dispatchEvent(focusEvent)
			}
		
		if (skipEvent) {
			
		} else if (document.activeElement) {
			$(document.activeElement).blur()
			setTimeout(doFocus,150)
		} else
			doFocus()
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
