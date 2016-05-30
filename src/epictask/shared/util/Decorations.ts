import 'reflect-metadata'

import {JSONKey} from '../Constants'
/**
 * Keep track of annotated property values
 *
 * @type {WeakMap<any, any>}
 */
const propertyMap = new WeakMap()

function getProps(target) {
	let props = propertyMap.get(target)
	if (!props) {
		propertyMap.set(target,(props = {}))
	}

	return props
}

/**
 * OnChange function type
 */
export type OnChangeFn  = (propertyKey:string, newVal:any) => any



export interface ConfigurePropertyOptions {
	enumerable?:boolean
	onChange?:OnChangeFn
}

/**
 * Adds a set listener
 *
 * Property is called with the target instance as _this_ context
 *
 * @returns {Function}
 * @param opts
 */
export function Property(opts:ConfigurePropertyOptions = {}):PropertyDecorator {
	return function (target:any, propertyKey:string | symbol) {

		const isEnumerable = opts.enumerable !== false
		Object.defineProperty(target,propertyKey,{
			enumerable: isEnumerable,
			get: function() {
				return getProps(this)[propertyKey] as any
			},
			set: function(newVal) {
				if (getProps(this)[propertyKey] === newVal)
					return

				getProps(this)[propertyKey] = newVal
				opts.onChange && opts.onChange.call(this,propertyKey,newVal)
			}

		})
	}
	

}

export function JSONInclude() {
	return function(target:any,propertyKey:string|symbol) {
		Reflect.defineMetadata(JSONKey,{jsonInclude:true},target,propertyKey)
	}
}