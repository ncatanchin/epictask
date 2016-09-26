



import { getHot, setDataOnDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand, TCommandContainer } from "shared/commands/Command"
import Electron = require('electron')
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { CommonKeys, GlobalKeys } from "shared/KeyMaps"
import { isNumber } from "shared/util/ObjectUtil"

function isReactComponent(c:any):c is React.Component<any,any> {
	return c && (
		c instanceof React.Component ||
		(c.prototype && c.prototype.isPrototypeOf(React.Component))
	)
}

const
	log = getLogger(__filename),
	InputTagNames = ['INPUT','SELECT','TEXTAREA'],
	isMain = process.type !== 'browser',
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:CommandManager,
		hotInstance:CommandManager
	}

	
	
function matchAcceleratorToEvent(accelerator:string|CommonKeys|false,event:KeyboardEvent) {
	if (accelerator === false)
		return false
	
	if (isNumber(accelerator))
		accelerator = GlobalKeys[accelerator]
	
	accelerator = accelerator.toLowerCase().replace(/\s/g,'')
	
	const
		parts = accelerator.split('+'),
		eventParts = [],
		addEventPart = (eventPart:string) => eventPart && eventParts.push(eventPart.toLowerCase())
	
	addEventPart(event.code)
	event.ctrlKey && addEventPart('ctrl')
	event.metaKey && addEventPart('super')
	event.shiftKey && addEventPart('shift')
	event.altKey && addEventPart('alt')
	
	log.info(`Comparing accel parts`,eventParts,parts)
	return parts.every(part => eventParts.includes(part))
	
}
	
	
interface ICommandContainerStatus {
	container:TCommandContainer
	element?:Element
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
 * Get the main command manager from the main process
 *
 * @returns {CommandManager}
 */
function getMainCommandManager() {
	const getter = (!Electron.remote) ?
		getCommandManager : Electron.remote.getGlobal('getCommandManager') as typeof getCommandManager
	
	
	return getter()
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
	 * Add a menu command, if on the renderer it trys to get the
	 * command manager on the main process
	 *
	 * @param cmd
	 */
	private addMenuCommand(cmd:ICommand) {
		if (isMain) {
			const
				mainManager = getMainCommandManager()
			
			if (!mainManager || mainManager === this) {
				throw new Error(`No Command Manager available on the main process`)
			}
		}
	}
	
	
	/**
	 * Map of all currently registered commands
	 */
	private commands:{[commandId:string]:ICommand} = {}
	
	/**
	 * Map of all current containers
	 */
	private containers:{[containerId:string]:ICommandContainerStatus} = {}
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		this.attach()
		this.load()
		
	}
	
	/**
	 * All Focused Containers
	 */
	private focusedContainers():ICommandContainerStatus[] {
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
		
		log.info(`Key down received`, event,`Ordered containers: `, containers.map(it => it.element))
		
		
		
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
	 * Attach to event producers
	 */
	private attach() {
		if (typeof window !== 'undefined') {
			window.document.addEventListener('keydown',(event) => this.handleKeyDown(event))
		}
	}
	
	/**
	 * Get or create container internally
	 *
	 * @param id
	 * @param container
	 * @param available
	 */
	private getContainerStatus(id:string,container:TCommandContainer,available:boolean):ICommandContainerStatus  {
		let
			status = this.containers[id]
		
		if (!status) {
			status = this.containers[id] = {
				container,
				available,
				focused: false,
				commands: [],
				element: isReactComponent(container) && ReactDOM.findDOMNode(container)
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
	registerCommand(id:string,container:TCommandContainer,...commands:ICommand[]) {
		commands.forEach(cmd => {
			log.info(`Registering command`,cmd)
			this.commands[cmd.id] = cmd
		})
		
		const
			status = this.getContainerStatus(id,container,true)
		
		status.commands =
			status
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
	unregisterCommand(id:string,container:TCommandContainer,...commands:ICommand[]) {
		commands.forEach(cmd => {
			log.info(`Removing command`,cmd)
			delete this.commands[cmd.id]
		})
		
		const
			status = this.getContainerStatus(id,container,false)
		
		status.commands = status.commands.filter(cmd => !commands.find(it => it.id === cmd.id))
	}
	
	
	/**
	 * Set container as focused
	 *
	 * @param id
	 * @param container
	 * @param focused
	 * @param event
	 * @returns {ICommandContainerStatus}
	 */
	setContainerFocused(id:string,container:TCommandContainer,focused:boolean, event:React.FocusEvent<any> = null) {
		log.info(`Focused on container ${id}`,container,event)
		
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
		Object.setPrototypeOf(fromInstance,CommandManager.prototype)
		newProto = Object.getPrototypeOf(fromInstance)
	}
	
	log.debug(`hot reloading`,fromInstance,fromProto,newProto,'Are protos equal?',newProto === fromProto)
}

setDataOnDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getCommandManager
}))

acceptHot(module,log)
