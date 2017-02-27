
import * as _ from 'lodash'


export function getHot<T extends any>(mod,key,defaultValue:T = null):T {
	if (module.hot) {
		return _.get(mod, `hot.data.${key}`, defaultValue) as any
	}
	return defaultValue
}


export function setDataOnHotDispose(mod, dataFn:() => any) {
	if (module.hot) {
		if (mod.hot) {
			mod.hot.addDisposeHandler((data:any) => {
				_.assign(data, dataFn())
			})
		}
	}
}

export function addHotDisposeHandler(mod,fn) {
	if (module.hot) {
		mod.hot.addDisposeHandler(fn)
	}
}

export function acceptHot(mod,logger = null) {
	if (module.hot) {
		if (mod.hot) {
			mod.hot.accept(() => (logger || console).debug(`Self accepting HMR`))
		}
	}
}

acceptHot(module,console)