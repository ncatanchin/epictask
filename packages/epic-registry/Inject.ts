

declare global {
	
	
	
	interface IInjector<T> {
		(target,name):any
	}
	
	/**
	 * Namespace declaration
	 */
	function Inject(key:string, id:string):IInjector<any>
	
	/**
	 * Static namespace - merged with all child declarations
	 */
	namespace Inject {
		
	}
	
}


/**
 * Injects a registry value
 *
 * @param scopeName
 * @param id
 * @returns {(target:any, propertyKey:any)=>{value: any}}
 * @constructor
 */
export function makeInjector(scopeName:string, id:string):IInjector<any> {
		return function(target,propertyKey) {
			return {
				value: Registry[scopeName][id]
			}
		}
}

export const Inject = makeInjector

assignGlobal({
	Inject
})