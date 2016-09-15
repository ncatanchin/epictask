
const log = getLogger(__filename)

export function getHot(mod,key,defaultValue = null):any {
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