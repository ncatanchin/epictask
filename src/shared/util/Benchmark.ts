

const log =getLogger(__filename)

export function Benchmark(name:string = null) {
	return (target:any,
	        propertyKey:string,
	        descriptor:TypedPropertyDescriptor<any>) => {
		if (!Env.isDev)
			return descriptor

		// Wrap the function for timing purposes
		const origFn = descriptor.value
		descriptor.value = function (...args:any[]) {
			const startTime = Date.now()
			let returnVal = null
			try {
				returnVal = origFn.call(this,...args)
			} finally {


				function doReport() {
					const duration = Date.now() - startTime

					log.info(`${name ? `${name}.` : '[BENCHMARK]'}${propertyKey} executed in ${duration}ms OR ${duration / 1000}s`)
				}


				// If a promised was returned then wait for it to resolve
				if (returnVal && _.isFunction(returnVal.then)) {
					log.debug('Got promiose result, attaching as thenable to report')
					returnVal.then(doReport)
				} else {
					doReport()
				}

			}

			return returnVal
		}

		//return descriptor
	}
}
