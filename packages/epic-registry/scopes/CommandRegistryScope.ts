
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {Registry} from "../Registry"
import { isString } from "typeguard"


const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)
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
	scope
	
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
		this.Unregister(id)
	}
	
	
	/**
	 * Auto register a class
	 * so it can be dynamically recreated in revivers etc
	 *
	 * @param configs
	 */
	Register = (...configs:ICommand[]) => {
		configs.forEach(config => {
			log.debug(`Registered command (${config.id}): ${config.name}`)
			this.scope[config.id] = config
		})
		
		this.commandsChanged()
	}
	
	/**
	 * Unregister a specific command(s)
	 *
	 * @param idsOrCommands
	 * @constructor
	 */
	Unregister = (...idsOrCommands:Array<string|ICommand>) => {
		idsOrCommands.forEach(idOrCommand => {
			if (isString(idOrCommand)) {
				delete this.scope[idOrCommand]
			} else {
				delete this.scope[idOrCommand.id]
			}
		})
		
		this.commandsChanged()
	}
	
	/**
	 * Get all current commands
	 */
	all() {
		return Object.values(this.scope).filter(it => it.name)
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
	 * @param id
	 * @returns {any}
	 */
	get(id):ICommand {
		const
			command = this.scope[id]
		
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
	 * All registered commands
	 */
	const Commands:any
	
	/**
	 * Command Registry Scope
	 */
	namespace CommandRegistryScope {
		
		/**
		 * Register a command
		 *
		 * @param configs
		 * @constructor
		 */
		function Register(...configs:ICommand[])
		
		/**
		 * Un-Register a command
		 *
		 * @param idsOrCommands
		 * @constructor
		 */
		function Unregister(...idsOrCommands:Array<string|ICommand>)
		
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
	Commands: commandRegistryScope.scope,
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