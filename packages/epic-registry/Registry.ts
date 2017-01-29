import "./RegistryEvents"

//import {ActionFactory} from 'typedux'

//import { decorateConstructor } from "./Decorations"
import { getValue, isString } from "typeguard"
import { setDataOnHotDispose, acceptHot, getHot } from "epic-global"


const
	log = getLogger(__filename)
		

declare global {
	interface IRegistryEntry<T> {
		scope:string
		id:string
		value:T
	}
	
	/**
	 * Scope for the registry, tool, service, model, etc
	 */
	interface IRegistryScope<T extends IRegistryEntry<any>> {
		readonly name:string
		
		
		register(id:string,opts:any,value:any)
		unregister(id:string)
	}
	
	/**
	 * Simple
	 */
	type TRegistry<T> = {[name:string]: IRegistryEntry<T>}
	
	
	
	namespace Registry {
		function addScope(scope:IRegistryScope<any>)
		
		function getScope(scopeName:string):IRegistryScope<any>
	}
	
	namespace Scopes {
	
	}
}



/**
 * Internal map of all registries
 *
 * @type {{[type:number]:RegistryType}
 */
export namespace Registry {
	
	const
		Scopes = getHot(module,'Scopes',{}) as {[name:string]:IRegistryScope<any>},
		HotRegistry = getHot(module, 'HotRegistry', {}) as any
	
	
	if (module.hot) {
		// RELOAD THE HOT REGISTRY
		Object.keys(HotRegistry).forEach(it => Registry[it] = HotRegistry[it])
		setDataOnHotDispose(module, () => ({ Scopes, HotRegistry }))
	}
	
	/**
	 * Assign/Create global scopes
	 */
	assignGlobal({
		Scopes
	})
	
	/**
	 * Get a scope
	 *
	 * @param scopeName
	 * @returns {TRegistry<any>}
	 */
	export function getScope(scopeName:string):TRegistry<any> {
		let
			scope = Registry[scopeName]
		
		if (!scope)
			scope = Registry[scopeName] = {}
		
		assert(scope,`Unknown registry scope: ${scope}`)
		return scope
	}
	
	export function addScope(scope:IRegistryScope<IRegistryEntry<any>>) {
		const
			{name} = scope
		
		// ADD SCOPE TO MAPPING FOR MANAGEMENT
		Scopes[name] = scope
		
		// CREATE NAMESPACE ON REGISTRY & INJECTOR
		//Registry[name] = {}
		
	}
	
	
	/**
	 * Decorator for registering
	 *
	 * @param scope
	 * @param id
	 * @param opts
	 *
	 */
	export function Register(scope:IRegistryScope<any>, id?:string,opts?:any)
	/**
	 * Decorator for registering
	 *
	 * @param scopeName
	 * @param id
	 * @param opts
	 *
	 */
	export function Register(scopeName:string, id?:string,opts?:any)
	export function Register(scopeOrScopeName:string|IRegistryScope<any>, id?:string,opts?:any) {
		return (target) => {
			if (!id) {
				id = target.name
			}
			
			const
				scope = isString(scopeOrScopeName) ? Scopes[scopeOrScopeName] : scopeOrScopeName
			
			assert(scope,`Unknown scope: ${scopeOrScopeName}`)
			
			log.debug(`Registering ${id} on scope ${scope.name}`)
			scope.register(id,opts,target)
		}
	}
	
}

/**
 * Alias Register
 *
 * @type {(scope:string, id?:string)=>(target)=>any}
 */
export const Register = Registry.Register

Object.assign(global,{
	Register,
	Registry,
	RegistryScope: {}
})

//
// /**
//  * Manual register a clazz
//  *
//  * @param name
//  * @param clazz
//  */
// function registerView(name,clazz:IViewConstructor) {
// 	getScope(Scope.View)[name] = {name,clazz}
// }
//
// /**
//  * Get window config registry
//  *
//  * @returns {TRegistry<IWindowConfig>}
//  */
// function getWindowConfigRegistry() {
// 	return getScope(Scope.WindowConfig) as TRegistry<IWindowConfig>
// }
//
// /**
//  * Get a window config
//  * @param name
//  *
//  */
// export function getWindowConfig(name:string):IWindowConfig {
// 	const
// 		entry = getWindowConfigRegistry()[name]
//
// 	assert(entry,`No window config found for ${name}`)
// 	return entry.value
// }
//
// /**
//  * Register a window config
//  *
//  * @param name
//  * @param windowConfig
//  */
// export function registerWindowConfig(name:string,windowConfig:IWindowConfig) {
// 	getWindowConfigRegistry()[name] = {
// 		name,
// 		value:windowConfig
// 	}
// }
//
//
// /**
//  * Auto register a view
//  *
//  * @param id
//  */
// export function RegisterView(id:string = null) {
// 	return (target:any) => {
// 		id = id || target.name
// 		log.info(`Registering view: ${id}`)
// 		registerView(id, target)
// 	}
// }
//
// /**
//  * Retrieve the class constructor for a given name
//  *
//  * @param id
//  * @returns {any}
//  */
// export function getView(id:string):IViewConstructor {
// 	const tool = getScope(Scope.View)[id]
// 	assert(tool,`View not found for ${id}`)
//
// 	return tool.clazz
// }

acceptHot(module,log)
