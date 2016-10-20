


import {List} from 'immutable'

const _ =
	require('lodash')

/**
 * Filter an IM list
 *
 * @param list
 * @returns {List<(value:any)=>any>}
 */
export function nilFilterList<T extends any,L extends List<T>>(list:L):L {
	return _.nilListFilter(list)
}

/**
 * Filter nils from the list
 *
 * @param a
 * @returns {T[]}
 */
export function nilFilter<T>(a:T[]):T[] {
	return _.nilFilter(a)
}
