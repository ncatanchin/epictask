import {List} from 'immutable'



import { isNil, isObject } from  "typeguard"


const
	_ = require('lodash')

export function clearArray(arr:Array<any>) {
	return arr.splice(0,arr.length)
}

export function isListType<T>(o:any,type:{new():T}):o is List<T> {
	return (List.isList(o))
}


/**
 * Get a value in a guarded fashion
 * ensuring no exception
 *
 * @param fn
 * @param defaultValue
 * @returns {any}
 */
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


/**
 * Execute a function guarded from exception
 *
 * @param fn
 * @returns {(fn:()=>any)=>(fn:()=>any)=>any}
 */
export function guard(fn:() => any) {
	try {
		fn()
	} catch (err) {
		return
	}
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
	if (!o)
		return o
	
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
					it.$$doc = cloneObjectShallow(base.$$doc)
				
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
	return o && assign(_.clone(o),...newSources)
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

/**
 * Decoration wrapper
 *
 * @param name
 * @param clazz
 * @param decorator
 * @param data
 * @returns {any}
 */
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

