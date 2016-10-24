

import { isSymbol, isString } from  "epic-global"

export const InvalidProxyNames = ['inspect','prototype','__proto__','constructor']

export function canProxyProperty(name:any) {
	return InvalidProxyNames.includes(name) || isSymbol(name)
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
