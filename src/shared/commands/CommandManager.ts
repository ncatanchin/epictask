



import { getHot, setDataOnDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand } from "shared/commands/Command"
const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:CommandManager,
		hotInstance:CommandManager
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
	 * Map of all currently registered commands
	 */
	private commands:{[commandId:string]:ICommand} = {}
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		this.attach()
		this.load()
		
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
		log.info(`Key down received`, event)
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
	 * Load or reload keymaps, commands, etc
	 */
	load() {
		log.info(`Loading commands & keymaps`)
	}
	
	register(command:ICommand) {
		log.info(`Registering command`,command)
		this.commands[command.id] = command
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
