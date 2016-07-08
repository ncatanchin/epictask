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
 * Auto rtegister a class
 * so it can be dynamically recreated in revivers etc
 *
 * @param clazz
 * @constructor
 */
export function RegisterModel<T>(clazz:ModelConstructor<T>) {
	const clazzName = clazz.name
	log.info(`Registering model: ${clazzName}`)
	registerModel(clazzName,clazz)

	return function() {
		const args = [];
		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}
		clazz.apply(this,args)
		this.$$clazz = clazzName
		// this.originalConstructor.call(this,...args)
		//
	} as any

}

/**
 * Manual register a clazz
 *
 * @param name
 * @param clazz
 */
function registerModel<T>(name,clazz:ModelConstructor<T>) {
	log.info(`Adding $$clazz to prototype of ${name}`)

	//const origConstructor = clazz.prototype.contructor


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
