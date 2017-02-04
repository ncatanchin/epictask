
import { getHot, setDataOnHotDispose, acceptHot } from "epic-global/HotUtils"
import {decorateConstructor} from 'epic-global/Decorations'
import {Registry} from "../Registry"



const
	log = getLogger(__filename)


/**
 * Global declarations
 */
declare global {
	
	interface IRegistryEntryModel extends IRegistryEntry<IModelConstructor<any>> {
		
	}
}


/**
 * Scope name
 *
 * @type {string}
 */
export const ModelScope = "Models"


/**
 * Model Registry Scope
 */
export class ModelRegistryScope implements IRegistryScope<IRegistryEntryModel> {
	
	/**
	 * Scope name
	 *
	 * @type {string}
	 */
	readonly name = ModelScope
	
	
	/**
	 * Scope container
	 */
	private scope
	
	/**
	 * Create the scope
	 */
	constructor() {
		this.scope = Registry.getScope(ModelScope)
	}
	
	/**
	 * Add component to the scope
	 *
	 * @param id
	 * @param opts
	 * @param target
	 */
	register(id:string,opts:IToolRegistration,target:any) {
		this.registerModel(id,target)
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
	 * @param target
	 */
	Register = <T extends IModelConstructor<any>>(target:T):T => {
		const
			clazzName = target.name
		
		target.$$clazz = clazzName
		
		const
			decoratedClazz = decorateConstructor(function(...args:any[]) {
				target.apply(this,args)
				this.$$clazz = clazzName
			},target) as T
		
		log.info(`Registering model: ${clazzName}`)
		
		
		this.registerModel(clazzName,decoratedClazz)
		
		return decoratedClazz
	}
	
	/**
	 * Manual register a clazz
	 *
	 * @param name
	 * @param clazz
	 */
	registerModel<T>(name,clazz:IModelConstructor<T>) {
		log.debug(`Adding $$clazz to prototype of ${name}`)
		this.scope[name] = {name,clazz}
	}
	
	
	/**
	 * Retrieve the class constructor for a given name
	 *
	 * @param name
	 * @returns {any}
	 */
	getModel(name):IModelConstructor<any> {
		const model = this.scope[name]
		assert(model, `Model not found for ${name}`)
		
		return model.clazz
	}
	
	
	
	
}








/**
 * Declare the constant scope name
 */

const
	modelRegistryScope = getHot(module,'hotInstance',new ModelRegistryScope())


declare global {
	
	
	
	namespace Scopes {
		namespace Models {
			function Register(target:any)
			
			function getModel(clazz):IModelConstructor<any>
		}
		
	}
}

Scopes.Models = modelRegistryScope
Registry.addScope(modelRegistryScope)

assignGlobal({
	ModelRegistryScope: modelRegistryScope
})



// HMR
if (module.hot) {
	
	// UPDATE HOT INSTANCE
	const
		hotInstance = getHot(module,'hotInstance')
	
	if (hotInstance) {
		Object.setPrototypeOf(hotInstance, ModelRegistryScope.prototype)
	}
	
	// ON DISPOSE
	setDataOnHotDispose(module,() => ({hotInstance: modelRegistryScope}))
	
	// ACCEPT SELF
	acceptHot(module, log)
}

export {}