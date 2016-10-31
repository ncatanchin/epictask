import {List,Map} from 'immutable'

const
	_ = require('lodash')



export function isNil(o:any) {
	return _.isNil(o)
}


export function isList(o:any):o is List<any> {
	return List.isList(o) || isFunction(o.toArray)
}

export function isMap(o:any):o is Map<any,any> {
	return Map.isMap(o)
}


export function isObject(o:any):o is Object {
	return _.isObject(o)
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