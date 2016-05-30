import './Globals'

const log = getLogger(__filename)

/**
 * Is a given value a function
 *
 * @param o
 * @returns {boolean}
 */
export function isFunction(o:any):o is Function {
	return typeof o === 'function'
}

/**
 * Is array type guard
 *
 * @param o
 */
export function isArray<T>(o:any|Array<T>):o is Array<T> {
	return Array.isArray(o)
}


/**
 * Internal map for property values
 *
 * @type {WeakMap<any, any>}
 */
const propertyValues = new WeakMap<any,any>()

/**
 * Simply function to get retype object properties
 *
 * @param target
 * @returns {any}
 */
function getProps(target) {
	let props = propertyValues[target]
	if (!props)
		props = propertyValues[target] = {}

	return props
}
/**
 * Mark a property as enumerable - or not
 *
 * @param value
 * @returns {function(any, string, PropertyDescriptor): undefined}
 * @constructor
 */
export function EnumerableProperty(value:boolean) {
	return function (target:any, propertyKey:string) {
		const descriptor = {
			enumerable:value,
			set: function(newVal) {
				const props = getProps(this)
				if (props[propertyKey] === newVal)
					return

				props[propertyKey] = newVal
			},
			get: function() {
				return getProps(this)[propertyKey]
			}
		}
		Object.defineProperty(target,propertyKey,descriptor)
		//descriptor.enumerable = value
	}
}


/**
 * Mark a property as enumerable - or not
 *
 * @param value
 * @returns {function(any, string, PropertyDescriptor): undefined}
 * @constructor
 */
export function Enumerable(value:boolean) {
	return function (target:any, propertyKey:string, descriptor:PropertyDescriptor) {
		descriptor.enumerable = value
	}
}

export interface SelfTyped<T> {
	new(): T
}

/**
 * Retrieve a deep property by string
 *
 * dot separated .
 *
 * @param o
 * @param path
 * @param defaultValue
 * @returns {T}
 */
export function getProperty<T>(o:any,path:string,defaultValue:T = null):T {
	const parts = path.split('.')
	let partVal = o
	for (let part of parts) {
		if (!partVal || !(partVal = partVal[part])) {
			return defaultValue
		}
	}

	return partVal as T
}

