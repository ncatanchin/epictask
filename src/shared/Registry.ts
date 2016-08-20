const log = getLogger(__filename)

export type RegistryType<T> = {[name:string]: {
	name:string,
	clazz:ModelConstructor<T>
}}

export interface ModelConstructor<T> {
	new (...args:any[]):T
	fromJS(o:any):T
}

/**
 * Internal map for keep track of models
 *
 * @type {RegistryType}
 */
const modelClasses = {} as RegistryType<any>

/**
 * Decorate a constructor - ripped from typescript-ioc - many thx ;)
 *
 * @param derived
 * @param base
 * @returns {Function}
 */
function decorateConstructor(derived: Function, base: Function) {
	for (let p of Object.getOwnPropertyNames(base)) {
		if (base.hasOwnProperty(p) && !derived.hasOwnProperty(p)) {
			derived[p] = base[p];
		}
	}
	derived['__parent'] = base;
	function __() { this.constructor = derived; }
	derived.prototype = base === null ? Object.create(base) :
		(__.prototype = base.prototype, new __());
	return derived;
}

/**
 * Auto rtegister a class
 * so it can be dynamically recreated in revivers etc
 *
 * @param target
 * @constructor
 */
//export function RegisterModel<T extends any>(target:ModelConstructor<T>) {
export function RegisterModel<T>(target:any) {
	const clazzName = target.name
	log.debug(`Registering model: ${clazzName}`)
	registerModel(clazzName,target)

	target.$$clazz = clazzName
	const original = target

	const newConstructor = decorateConstructor(function(...args:any[]) {
		target.apply(this,args)
		this.$$clazz = clazzName
	},target)

	return newConstructor as any

}

/**
 * Manual register a clazz
 *
 * @param name
 * @param clazz
 */
function registerModel<T>(name,clazz:ModelConstructor<T>) {
	log.debug(`Adding $$clazz to prototype of ${name}`)
	modelClasses[name] = {name,clazz}
}


/**
 * Retrieve the class constructor for a given name
 *
 * @param name
 * @returns {any}
 */
export function getModel(name):ModelConstructor<any> {
	const model = modelClasses[name]
	if (!model)
		throw new Error(`Model not found for ${name}`)
	
	return model.clazz
}
