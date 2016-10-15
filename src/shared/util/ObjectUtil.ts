import {List} from 'immutable'

import 'shared/NamespaceConfig'
import './LoDashMixins'
import {generate as generateShortId} from 'short-id'

export const InvalidProxyNames = ['inspect','prototype','__proto__','constructor']

const
	_ = require('lodash')

export function isNil(o:any) {
	return _.isNil(o)
}

export function nilFilterList<L extends List<any>>(list:L):L {
	return _.nilListFilter(list)
}

export function nilFilter<T>(a:T[]):T[] {
	return _.nilFilter(a)
}


export function isListType<T>(o:any,type:{new():T}):o is List<T> {
	return (List.isList(o))
}

export function isObject(o:any):o is Object {
	return _.isObject(o)
}

export function getValue<T>(fn:() => T,defaultValue:T = null):T {
	let
		result
	
	try {
		result = fn()
	} catch (err) {
	}
	
	if (isNil(result))
		result = defaultValue
	
	return result
}

export function isPromise(o:any):o is Promise<any> {
	return o && isObject(o) && (o instanceof Promise || isFunction(o.then))
}

export function isObjectType<T>(o:any,type:{new():T}):o is T {
	return o instanceof type || o.$$clazz === type.name
}

export function isString(o:any):o is string {
	return _.isString(o)
}

export function isNumber(o:any):o is number {
	return _.isNumber(o) && !isNaN(o)
}

export function isFunction(o:any):o is Function {
	return _.isFunction(o)
}

export function isSymbol(o:any):o is Symbol {
	return typeof o === 'symbol'
}


export function toNumber(str:string|number):number {
	return isNumber(str) ? str : parseInt(str,10)
}

export function canProxyProperty(name:any) {
	return InvalidProxyNames.includes(name) || isSymbol(name)
}

/**
 * Generates a short id
 *
 * @returns {string}
 */
export function shortId():string {
	return generateShortId()
}

/**
 * Generates v4 UUID
 *
 * @returns {string}
 */
export function uuid():string {
	return require('node-uuid').v4()
}

export function hasOwnProps(o:any,...props:string[]) {
	return o && props.every(prop => o.hasOwnProperty(prop))
}


/**
 * Object cloning wrapper with some special extras
 * - copies typestore $$docs value
 * - copies explicit ids
 *
 * @param o
 * @param newSources
 * @returns {any}
 */
export function cloneObject<T>(o:T,...newSources:any[]):T {
	const
		cloned = _.cloneDeep(o),
		
		/**
		 * After clone - copy special props, etc
		 *
		 * @param it
		 * @param index
		 */
		afterObjectClone = (it,index = -1) => {
			const
				base:any = index === -1 ? o : o[index]
			
			if (base && isObject(it)) {
				if (base.id)
					it.id = base.id
				
				if (base.$$doc)
					it.$$doc = cloneObject(base.$$doc)
				
				assign(it,...newSources)
			}
			
			
		}
	
	
	
	if (cloned) {
		
		// ARRAY CLONED
		if (Array.isArray(cloned)) {
			cloned.forEach((it,index) => {
				afterObjectClone(it,index)
			})
		}
		
		// SINGLE OBJECT CLONED
		else if (isObject(cloned)) {
			afterObjectClone(cloned)
		}
		
	}
	
	return cloned

}

/**
 * Shallow clone object and assign properties
 *
 * @param o
 * @param newSources
 */
export function cloneObjectShallow<T>(o:T,...newSources:any[]):T {
	return assign(_.clone(o),...newSources)
}

/**
 * Shallow equal an array or list
 *
 * @param val1
 * @param val2
 * @param props
 * @returns {boolean}
 */
export function shallowEqualsArrayOrList(val1,val2,...props:string[]) {
	
	if (!val1 || !val2)
		return false
	
	const
		isArray = (Array.isArray(val1) && Array.isArray(val2) && val1.length === val2.length),
		isList = List.isList(val1) && List.isList(val2) && val1.size === val2.size
			
	
	return (isArray || isList) && val1.every((testVal1,index) =>  {
		const
			testVal2 = (isArray ? val2[index] : val2.get(index))
			
		return (!props.length) ? testVal1 === testVal2 : shallowEquals(testVal1,testVal2,...props)
	})
}

/**
 * Shallow equal a specific property key for two objects
 *
 * @param o1
 * @param o2
 * @param key
 * @returns {boolean}
 */
export function shallowEqualsProp(o1,o2,key) {
	const
		val1 = _.get(o1,key),
		val2 = _.get(o2,key)
	
	return val1 === val2 ||
		shallowEqualsArrayOrList(val1,val2)
}

/**
 * Shallow equals two objects on either all own properties - OR - specific props provided
 *
 * @param o1
 * @param o2
 * @param props
 * @returns {any}
 */
export function shallowEquals(o1,o2,...props:string[]) {
	if (o1 === o2)
		return true
	
	const
		o1Props = o1 && Object.keys(o1),
		o2Props = o2 && Object.keys(o2)
	
	
	
	return (o1Props && o2Props &&
		(props.length || o1Props.length === o2Props.length) &&
			(props.length ? props : o1Props)
				.every(key => shallowEqualsProp(o1,o2,key)))
}

export function postConstructorDecorate<T>(name:string, clazz:{new():T}, decorator:(instance:T,args:any[],data:any) => T,data:any = null) {
	const makeDecorator =  new Function('name','clazz','decorator','data',`
		function ${name}() {
			clazz.apply(this,arguments);
			decorator(this,arguments,data);
		}
		
		${name}.prototype = clazz.prototype;
		return ${name};
	`)
	
	return makeDecorator(name,clazz,decorator,data)
}


export function interceptFn(o,key,interceptor = null) {
	if (!isString(key)) {
		Object.keys(key).forEach(prop => interceptFn(o,prop,key[prop]))
	} else {
		const origFn = o[key]
		o[key] = function (...args:any[]) {
			return interceptor.apply(this, [origFn && origFn.bind(this), ...args])
		}
	}
}

export interface IValueTransformer {
	(key:string,val:any):any
}

export function transformValues(o,fn:IValueTransformer) {
	return (Array.isArray(o)) ?
		o.map(aVal => transformValues(aVal,fn)) :
		(typeof o === "object") ?
			Object
				.keys(o)
				.reduce((newObj,nextKey) => {
					newObj[nextKey] = fn(nextKey,o[nextKey])
					return newObj
				},{}) :
			o

}

export function extractError(error:Error) {
	let newError:Error = null
	if (error) {
		newError = _.cloneDeep(_.pick(error, ['message', 'statusCode', 'errors']))
		if (!newError.message)
			newError.message = error.message || error.toString() || 'Save failed'
	}
	return newError
}

export function convertEnumValuesToString(obj) {
	Object.keys(obj).forEach((key) => {
		if (isNaN(+key)) {
			Object.defineProperty(obj, key, {
				value: key,
				enumerable: true
			})
		}
	})
	return obj;
}

