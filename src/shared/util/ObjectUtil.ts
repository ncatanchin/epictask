import {List,Map} from 'immutable'



declare global {
	interface LodashMixins {
		isArrayEqualBy(arr1,arr2,prop):boolean
		inline<R>(fn:()=>R):R
		uniqueListBy<T>(list:List<T>,...keyPath:string[]):List<T>
		toJS(o:any):any
		assignGlobal(o:any):any
		isPromise(o:any):boolean
		modelArrayToMapBy(o:any[],prop:string):any
		nilFilter<T>(o:T[]):T[]
	}


}

const _ = require('lodash')

/**
 * Mixin lo dash functions
 *
 * isArrayEqual
 */
_.mixin({
	nilFilter<T>(a:T[]):T[] {
		return !a ? [] : a.filter(item => !_.isNil(item))
	},
	modelArrayToMapBy<M>(models:M[],prop:string):{[key:string]:M} {
		return models.reduce((map,model) => {
			map[`${model[prop]}`] = model
			return map
		},{})
	},
	isPromise(o:any) {
		return o instanceof Promise || (o && _.isFunction(o.then))
	},
	isArrayEqualBy(arr1,arr2,prop) {
		return arr1 === arr2 ||  _.isEqual(
			!arr1 ? null : arr1.map(v => v[prop]).sort(),
			!arr2 ? null : arr2.map(v => v[prop]).sort()
		)
	},

	inline<R>(fn:()=>R):R {
		return fn()
	},

	uniqueListBy<T>(list:List<T>,...keyPath:string[]):List<T> {
		function getKey(o) {
			return Map.isMap(o) ?
				(o as any).get(keyPath) :
				_.get(o,keyPath)
		}

		return list.filter((item,index) => {
			const key = getKey(item)
			const otherItem = list
				.find((itemFind,indexFind) => indexFind < index && itemFind !== item &&
					key === getKey(itemFind))

			return !otherItem
		}) as any
	},

	toJS(o:any):any {
		return (o && _.isFunction(o.toJS)) ? o.toJS() : o
	},

	assignGlobal(o:any) {
		const g = global as any
		Object.assign(g,o)
	}
})






export function isNil(o:any) {
	return _.isNil(o)
}

export function cloneObject<T>(o:T,...newSources:any[]):T {
	const cloned = _.cloneDeep(o)

	if (Array.isArray(cloned)) {
		cloned.forEach((acloned,index) => {
			acloned.id = o[index].id
			_.assign(acloned,...newSources)
		})
	} else {
		cloned.id = (o as any)['id']
		_.assign(cloned,...newSources)
	}

	return cloned

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
