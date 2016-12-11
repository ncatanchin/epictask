
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {decorateConstructor} from 'epic-global/Decorations'
import {Registry} from "../Registry"



const
	log = getLogger(__filename)


/**
 * Global declarations
 */
declare global {
	
	interface IViewConfig {
		name:string
		type:string
		defaultView?:boolean
		provider: TPromisedComponentLoader
	}
	
	interface IRegistryEntryView extends IRegistryEntry<IViewConfig> {
		
	}
	
	
}


/**
 * Scope name
 *
 * @type {string}
 */
export const ViewScope = "View"


/**
 * View Registry Scope
 */
export class ViewRegistryScope implements IRegistryScope<IRegistryEntryView> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = ViewScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(ViewScope)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:any,target:IViewConfig) {
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
	Register = (config:IViewConfig) => {
		log.debug(`Registered view: ${config.name}`)
		this.scope[config.name] = config
		this.viewsChanged()
	}
	
	/**
	 * Get all current views
	 */
	all() {
		return Object.values(this.scope).filter(it => it.name && it.provider)
	}
	
	/**
	 * Map of all current views
	 */
	asMap():TViewConfigMap {
		return this.all()
			.reduce((map,config) => {
				map[config.type] = config
				return map
			},{} as TViewConfigMap)
	}
	
	getDefault():IViewConfig {
		const
			configs = this.all()
		
		return configs.find(it => it.defaultView === true) || configs[0]
	}
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param name
	 * @returns {any}
	 */
	get(name):IViewConfig {
		const
			view = this.scope[name]
		
		assert(view, `View not found for ${name}`)
		
		return view
	}
	
	
	
	
	/**
	 * Emit views changed
	 */
	private viewsChanged = _.debounce(() => EventHub.emit(EventHub.ViewsChanged,this.all()),100)
}








/**
 * Declare the constant scope name
 */

const
	viewRegistryScope = getHot(module,'hotInstance',new ViewRegistryScope())


declare global {
	
	type TViewConfigMap = {[type:string]:IViewConfig}
	
	/**
	 * Get all current views
	 */
	function getViews():TViewConfigMap
	
	/**
	 * View Registry Scope
	 */
	namespace ViewRegistryScope {
		
		/**
		 * Register a view
		 *
		 * @param config
		 * @constructor
		 */
		function Register(config:IViewConfig)
		
		/**
		 * Get all registered views
		 */
		function all():IViewConfig[]
		
		/**
		 * Get all as map
		 */
		function asMap():TViewConfigMap
		
		/**
		 * Get a view by name
		 *
		 * @param name
		 */
		function getDefault():IViewConfig
		
		
		/**
		 * Get a view by name
		 *
		 * @param name
		 */
		function get(name:string):IViewConfig
		
		
	}
	
	namespace RegistryScope {
		let View:ViewRegistryScope
	}
}


RegistryScope.View = viewRegistryScope
Registry.addScope(viewRegistryScope)

assignGlobal({
	getViews() {
		return viewRegistryScope.asMap()
	},
	ViewRegistryScope: viewRegistryScope
})



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, ViewRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: viewRegistryScope}))
	
	// ACCEPT SELF
	acceptHot(module, log)
}

export {}