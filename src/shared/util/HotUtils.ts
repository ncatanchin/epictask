
const log = getLogger(__filename)

export function getHot<T extends any>(mod,key,defaultValue:T = null):T {
	return _.get(mod,`hot.data.${key}`,defaultValue) as any
}


export function setDataOnDispose(mod,dataFn:() => any) {
	if (mod.hot) {
		mod.hot.addDisposeHandler((data:any) => {
			log.info(`Setting hot data`)
			_.assign(data,dataFn())
		})
	}
}

export function acceptHot(mod,logger) {
	if (mod.hot) {
		mod.hot.accept(() => logger.info(`Self accepting HMR`))
	}
}