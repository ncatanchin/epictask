import {List} from 'immutable'

import 'shared/NamespaceConfig'
import './LoDashMixins'
import {generate as generateShortId} from 'short-id'
import { InvalidProxyNames } from "shared/Constants"

const _ = require('lodash')

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

export function canProxyProperty(name:any) {
	return InvalidProxyNames.includes(name) || isSymbol(name)
}

export function shortId():string {
	return generateShortId()
}

export function uuid():string {
	return require('node-uuid').v4()
}

export function cloneObject<T>(o:T,...newSources:any[]):T {
	const cloned = _.cloneDeep(o)
	
	if (cloned) {
		if (Array.isArray(cloned)) {
			cloned.forEach((acloned,index) => {
				if (o[index] && isObject(o[index]))
					acloned.id = o[index].id
				
				_.assign(acloned,...newSources)
			})
		} else if (_.isObject(cloned)) {
			cloned.id = (o as any)['id']
			_.assign(cloned,...newSources)
		}
		
	}
	
	return cloned

}


export function shallowEqualsProp(o1,o2,key) {
	const
		val1 = _.get(o1,key),
		val2 = _.get(o2,key)
	
	return val1 === val2 ||
		(val1 && val2 &&
		Array.isArray(val1) && Array.isArray(val2) &&
		val1.length === val2.length &&
		val1.every((testVal,index) => testVal === val2[index]))
}

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

