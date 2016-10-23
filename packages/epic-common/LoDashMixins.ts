
import {List,Map} from 'immutable'

export type TListTypes<T> = Array<T>|List<T>



declare global {
	
	
	module _ {
		interface LoDashStatic {
			isArrayEqualBy(arr1, arr2, prop):boolean
			inline<R>(fn:()=>R):R
			uniqueListBy<T>(list:List<T>, ...keyPath:string[]):List<T>
			toJS(o:any):any
			assignGlobal:IAssignGlobal
			isPromise(o:any):boolean
			modelArrayToMapBy(o:any[], prop:string):any
			nilFilter<T>(o:T[]):T[]
			nilListFilter<T extends any>(a:List<T>):List<T>
		}
	}
}

 

const _ = require('lodash')

/**
 * Mixin lo dash functions
 *
 * isArrayEqual
 */
_.mixin({
	nilListFilter<T extends any>(a:List<T>):List<T> {
		return !a ? List<T>() : a.filter(item => !_.isNil(item)) as any
	},
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
	
	assignGlobal(...sources:any[]) {
		const
			g = global as any
		
		Object.assign(g,...sources)
	}
})

export {
	
}