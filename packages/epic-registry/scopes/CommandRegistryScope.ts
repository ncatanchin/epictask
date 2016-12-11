
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {Registry} from "../Registry"


const
	log = getLogger(__filename)


/**
 * Global declarations
 */
declare global {
	
	interface IRegistryEntryCommand extends IRegistryEntry<ICommand> {}
	
	
}


/**
 * Scope name
 *
 * @type {string}
 */
export const CommandScope = "Command"


/**
 * Command Registry Scope
 */
export class CommandRegistryScope implements IRegistryScope<IRegistryEntryCommand> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = CommandScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(CommandScope)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:any,target:ICommand) {
		this.Register(target)
	}
	
	/**
	 * Remove a component from the scope
	 *
	 * @param id
	 */
	unregister(id:string) {
		
	}
	
	
	/**
	 * Auto register a class
	 * so it can be dynamically recreated in revivers etc
	 *
	 * @param config
	 */
	Register = (config:ICommand) => {
		log.debug(`Registered command: ${config.name}`)
		this.scope[config.name] = config
		this.commandsChanged()
	}
	
	/**
	 * Get all current commands
	 */
	all() {
		return Object.values(this.scope).filter(it => it.name && it.provider)
	}
	
	/**
	 * Map of all current commands
	 */
	asMap():TCommandConfigMap {
		return this.all()
			.reduce((map,config) => {
				map[config.type] = config
				return map
			},{} as TCommandConfigMap)
	}
	
	getDefault():ICommand {
		const
			configs = this.all()
		
		return configs.find(it => it.defaultCommand === true) || configs[0]
	}
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param name
	 * @returns {any}
	 */
	get(name):ICommand {
		const
			command = this.scope[name]
		
		assert(command, `Command not found for ${name}`)
		
		return command
	}
	
	
	
	
	/**
	 * Emit commands changed
	 */
	private commandsChanged = _.debounce(() => EventHub.emit(EventHub.CommandsChanged,this.all()),100)
}








/**
 * Declare the constant scope name
 */

const
	commandRegistryScope = getHot(module,'hotInstance',new CommandRegistryScope())


declare global {
	
	type TCommandConfigMap = {[type:string]:ICommand}
	
	/**
	 * Get all current commands
	 */
	function getCommands():TCommandConfigMap
	
	/**
	 * Command Registry Scope
	 */
	namespace CommandRegistryScope {
		
		/**
		 * Register a command
		 *
		 * @param config
		 * @constructor
		 */
		function Register(config:ICommand)
		
		/**
		 * Get all registered commands
		 */
		function all():ICommand[]
		
		/**
		 * Get all as map
		 */
		function asMap():TCommandConfigMap
		
		/**
		 * Get a command by name
		 *
		 * @param name
		 */
		function getDefault():ICommand
		
		
		/**
		 * Get a command by name
		 *
		 * @param name
		 */
		function get(name:string):ICommand
		
		
	}
	
	namespace RegistryScope {
		let Command:CommandRegistryScope
	}
}


RegistryScope.Command = commandRegistryScope
Registry.addScope(commandRegistryScope)

assignGlobal({
	getCommands() {
		return commandRegistryScope.asMap()
	},
	CommandRegistryScope: commandRegistryScope
})



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, CommandRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: commandRegistryScope}))
	
	// ACCEPT SELF
	acceptHot(module, log)
}

export {}