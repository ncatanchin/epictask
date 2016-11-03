

const
	log = getLogger(__filename)


/**
 * benchmarking function to use anywhere
 *
 * @param name
 * @param origFn
 * @param detail
 */
export function benchmark<T extends Function>(name, origFn:T,detail:string = ''):T {
	return function (...args:any[]) {
		const
			startTime = Date.now()
		
		let
			returnVal:any = null
		
		try {
			returnVal = origFn.call(this,...args)
		} finally {
			
			const
				isPromise = returnVal && returnVal instanceof Promise
			
			/**
			 * Since our reporting function can be attached to a promise
			 * we want to make sure to pass any value passed in directly thru
			 *
			 * @param passthruVal
			 * @returns {null}
			 */
			const doReport = (passthruVal = null) => {
				const
					duration = Date.now() - startTime
				
				
				log.info(`${name ? `${name}.` : '[BENCHMARK]'}${detail} ${isPromise ? 'PromiseResolve' : '' } executed in ${duration}ms OR ${duration / 1000}s`)
				
				return passthruVal
			}
			
			
			// If a promised was returned then wait for it to resolve
			if (isPromise) {
				log.debug('Got promise result, attaching as then-able to report')
				returnVal.then(doReport)
			} else {
				doReport()
			}
		}
		
		return returnVal
	} as any
}

/**
 * Benchmark decorator function - can be used as an
 * es7 / typescript decorator or as a standalone function wrapper
 */

export function Benchmark(name:string = null) {
	return (target:any,
	        propertyKey:string,
	        descriptor:TypedPropertyDescriptor<any>) => {
		if (!Env.isDev)
			return descriptor

		// Wrap the function for timing purposes
		const origFn = descriptor.value
		descriptor.value = benchmark(name,origFn,propertyKey)
		

		//return descriptor
	}
}
