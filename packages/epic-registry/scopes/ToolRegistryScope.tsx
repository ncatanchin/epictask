

import {Map,List} from 'immutable'
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global"
import { getValue } from "typeguard"



const
	log = getLogger(__filename)


/**
 * Tool panel location
 */
export enum ToolPanelLocation {
	Left = 1,
	Right = 2,
	Bottom = 3,
	Popup = 4
}

/**
 * Global declarations
 */
declare global {
	enum ToolPanelLocation {
		Left = 1,
		Right = 2,
		Bottom = 3,
		Popup = 4
	}
	
	interface IRegistryEntryTool extends IRegistryEntry<ITool> {
		name:string
		data?:any
		react?:any
		
	}
	
	interface IToolConstructor extends React.ComponentClass<IToolProps> {
	
	}
	
	
	
	
	/**
	 * Map of tools by id
	 */
	type TToolMap = Map<string,ITool>
	
	/**
	 * Denotes an available tool in the system
	 */
	interface IToolConfig {
		/**
		 * Unique string identifying tool
		 */
		readonly id:string
		
		/**
		 * Optional label value
		 */
		readonly label:string
		
		/**
		 * Optional gutter button label
		 */
		readonly buttonLabel?:string
		
		/**
		 * Default tool location
		 */
		readonly defaultLocation?:ToolPanelLocation
	}
	
	/**
	 * Tool Registration
	 */
	interface IToolRegistration extends IToolConfig {
		getHeaderControls?: () => React.ReactElement<any>[]
	}
	
	
	/**
	 * Tool Shape w/State Info
	 */
	interface ITool extends IToolConfig {
		
		/**
		 * Set/Get active status
		 */
		active:boolean
		
		/**
		 * Any extra data
		 */
		data?:any
	}
	
	/**
	 * Tool Panel Status
	 */
	interface IToolPanel {
		id:string
		location:ToolPanelLocation
		tools:Map<string,ITool>
		toolIds:List<string>
		open:boolean
		isDefault?:boolean
		data?:any
	}
	
	/**
	 * Base props for Tool Component
	 */
	interface IToolProps extends React.HTMLAttributes<any> {
		tool:ITool
		visible:boolean
		panel:IToolPanel
	}
	
}


/**
 * Scope name
 *
 * @type {string}
 */
export const ToolScope = "Tool"


/**
 * Tool Registry Scope
 */
export class ToolRegistryScope implements IRegistryScope<IRegistryEntryTool> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = ToolScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(ToolScope)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:IToolRegistration,target:any) {
		this.Register(assign({},opts,id && {id}))(target)
	}
	
	/**
	 * Remove a component from the scope
	 *
	 * @param id
	 */
	unregister(id:string) {
		
	}
	
	/**
	 * Auto register a tool
	 *
	 * @param reg
	 */
	Register = (reg:IToolRegistration) => {
		return (target:IToolConstructor) => {
			const
				id = reg.id || target.name
			
			log.info(`Registering tool: ${id}`)
			
			return this.registerTool(reg, target) as any
		}
	}
	
	
	
	/**
	 * Manual register a clazz
	 *
	 * @param reg
	 * @param clazz
	 */
	registerTool(reg:IToolRegistration,clazz:IToolConstructor) {
		const
			createReactProxy = require('react-proxy').default
		
		try {
			log.info(`Registering ${reg.id}`)
			let
				config = Registry.getScope(ToolScope)[reg.id],
				update = false
			
			if (config) {
				update = true
				
				config.data = {
					reg
				}
				config.clazz = clazz
				config.react.getHeaderControls = reg.getHeaderControls
				config.react.proxy.update(clazz)
			} else {
				const
					proxy = createReactProxy(clazz)
				
				config = this.scope[reg.id] = {
					name: reg.id,
					data: {
						reg
					},
					clazz,
					react: {
						proxy,
						proxyComponent: proxy.get(),
						getHeaderControls: reg.getHeaderControls
					}
				}
			}
			//
			// const UIActionFactory = require("shared/actions/ui/UIActionFactory").UIActionFactory as typeof UIActionFactoryType
			// Container.get(UIActionFactory).registerTool(reg as any)
			
			
			//if (update) {
			this.toolsChanged()
			//}
			
			return config
				.react
				.proxyComponent
			
		} catch (err) {
			log.error(`Failed to register tool`,err)
			getNotificationCenter().notifyError(err)
			
			return clazz
		}
		
		
	}
	
	/**
	 * Get a tool config
	 *
	 * @param id
	 * @returns {RegistryEntry<any>}
	 */
	getToolConfig(id:string) {
		return this.scope[id]
	}
	
	/**
	 * get tool registration
	 *
	 * @param id
	 * @returns {IToolRegistration}
	 */
	getToolRegistration = (id:string):IToolRegistration => {
		return getValue(() => this.getToolConfig(id).data.reg) as IToolRegistration
	}
	
	
	
	
	
	
	/**
	 * Get all tool ids
	 *
	 * @returns {string[]}
	 */
	getToolIds():string[] {
		return Object.keys(this.scope)
	}
	
	/**
	 * Get all tool configs
	 *
	 * @returns {IToolRegistration[]}
	 */
	getToolRegistrations():IToolConfig[] {
		return this.getToolIds().map(this.getToolRegistration)
	}
	
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param id
	 * @returns {any}
	 */
	getToolComponent(id:string):IToolConstructor {
		const
			tool = this.getToolConfig(id)
		
		assert(tool,`Tool not found for ${id}`)
		
		return tool.clazz// tool.react.proxyComponent
	}
	
	/**
	 * Get tool component class
	 *
	 * @param id
	 * @returns {any}
	 */
	getToolComponentClass(id:string):IToolConstructor {
		const tool = this.getToolConfig(id)
		assert(tool,`Tool not found for ${id}`)
		
		return tool.clazz
	}
	
	/**
	 * Get tool header controls
	 *
	 * @param id
	 * @returns {React.ReactElement<any>[]|Array}
	 */
	getToolHeaderControls(id:string):React.ReactElement<any>[] {
		const tool = this.getToolConfig(id)
		assert(tool,`Tool not found for ${id}`)
		
		return tool.react.getHeaderControls ? tool.react.getHeaderControls() : []
	}
	
	
	private toolsChanged = _.debounce(() => {
		EventHub.emit(EventHub.ToolsChanged)
	})
}








/**
 * Declare the constant scope name
 */

const
	toolRegistryScope = getHot(module,'hotInstance',new ToolRegistryScope())


assignGlobal({
	ToolRegistryScope: toolRegistryScope,
	ToolPanelLocation
})

declare global {
	namespace ToolRegistryScope {
		
		function Register(reg:IToolRegistration)
		
		/**
		 * Get all tool ids
		 *
		 * @returns {string[]}
		 */
		function getToolIds():string[]
		
		/**
		 * Get all tool configs
		 *
		 * @returns {IToolRegistration[]}
		 */
		function getToolRegistrations():IToolConfig[]
		
		
		/**
		 * Retrieve the class constructor for a given name
		 *
		 * @param id
		 * @returns {any}
		 */
		function getToolComponent(id:string):IToolConstructor
		
		/**
		 * Get tool component class
		 *
		 * @param id
		 * @returns {any}
		 */
		function getToolComponentClass(id:string):IToolConstructor
		
		/**
		 * Get tool header controls
		 *
		 * @param id
		 * @returns {React.ReactElement<any>[]|Array}
		 */
		function getToolHeaderControls(id:string):React.ReactElement<any>[]
	}
	namespace RegistryScope {
		let Tool:ToolRegistryScope
	}
}

RegistryScope.Tool = toolRegistryScope
Registry.addScope(toolRegistryScope)



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, ToolRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: toolRegistryScope}))

	// ACCEPT SELF
	acceptHot(module, log)
}
export {}