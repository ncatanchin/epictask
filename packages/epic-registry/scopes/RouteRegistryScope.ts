
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {decorateConstructor} from 'epic-global/Decorations'
import {Registry} from "../Registry"



const
	log = getLogger(__filename)


/**
 * Global declarations
 */
declare global {
	
	interface IRouteConfig {
		name:string
		uri:string
		provider: TPromisedComponentLoader
		authenticated?:boolean
		showDevTools?:boolean
		defaultRoute?:boolean
		title?:string
		makeURI?:Function
	}
	
	interface IRegistryEntryRoute extends IRegistryEntry<IRouteConfig> {
		
	}
	
	
}


/**
 * Scope name
 *
 * @type {string}
 */
export const RouteScope = "Route"


/**
 * Route Registry Scope
 */
export class RouteRegistryScope implements IRegistryScope<IRegistryEntryRoute> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = RouteScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(RouteScope)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:any,target:IRouteConfig) {
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
	 * @param configs
	 */
	Register = (...configs:IRouteConfig[]) => {
		configs.forEach(config => {
			if (config.defaultRoute) {
				const
					defaultRoute = Object.values(this.scope).find(it => it.defaultRoute === true)
				
				if (defaultRoute)
					assert(!defaultRoute,`A default route already exists (${defaultRoute.name}) - can not register ${config.name} as a default route`)
			}
			
			log.debug(`Registered route: ${config.name}`)
			this.scope[config.name] = config
		})
		
		this.routesChanged()
	}
	
	/**
	 * Get all current routes
	 */
	all() {
		return Object.values(this.scope).filter(it => it.name && it.provider && it.uri)
	}
	
	/**
	 * Get all as route map
	 */
	asRouteMap():TRouteMap {
		return this
			.all()
			.reduce((routes,root) => {
				routes[root.uri] = root
				return routes
			},{})
	}
	
	/**
	 * Get route scope
	 */
	asMap():{[name:string]:IRouteConfig} {
		return this.scope
	}
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param name
	 * @returns {any}
	 */
	get(name):IRouteConfig {
		const
			route = this.scope[name]
		
		assert(route, `Route not found for ${name}`)
		
		return route
	}
	
	
	
	
	/**
	 * Emit routes changed
	 */
	private routesChanged = _.debounce(() => EventHub.emit(EventHub.RoutesChanged,this.all()),100)
}








/**
 * Declare the constant scope name
 */

const
	routeRegistryScope = getHot(module,'hotInstance',new RouteRegistryScope())


declare global {
	
	/**
	 * Route Registry Scope
	 */
	namespace RouteRegistryScope {
		
		/**
		 * Register a route
		 *
		 * @param config
		 * @constructor
		 */
		function Register(...configs:IRouteConfig[])
		
		/**
		 * Get all registered routes
		 */
		function all():IRouteConfig[]
		
		/**
		 * Get a route by name
		 *
		 * @param name
		 */
		function get(name):IRouteConfig
		
		/**
		 * As route map for routers
		 */
		function asRouteMap():TRouteMap
		
		/**
		 * Get route scope
		 */
		function asMap():{[name:string]:IRouteConfig}
	}
	
	namespace RegistryScope {
		let Route:RouteRegistryScope
	}
	
	/**
	 * Global pages accessor
	 */
	function getRoutes():any
}

RegistryScope.Route = routeRegistryScope
Registry.addScope(routeRegistryScope)

assignGlobal({
	getRoutes() {
		return routeRegistryScope.asMap()
	},
	RouteRegistryScope: routeRegistryScope
})



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, RouteRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: routeRegistryScope}))
	
	// ACCEPT SELF
	acceptHot(module, log)
}

export {}