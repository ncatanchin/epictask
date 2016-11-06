
const
	log = getLogger(__filename)

export function focusElementById(id:string,timeout = 50) {
	if (ProcessConfig.isType(ProcessType.UI))
		setTimeout(() => $(`#${id}`).focus(),timeout)
}


export function isReactComponent(c:any):c is React.Component<any,any> {
	return c && (
			c instanceof React.Component ||
			(c.prototype && c.prototype.isPrototypeOf(React.Component))
		)
}

/**
 * Unwrapped references
 *
 * @param component
 * @returns {any}
 */
export function unwrapRef<T>(component:T):T {
	
	while(component && (component as any).getWrappedInstance) {
		component = (component as any).getWrappedInstance()
	}
	
	return component as any
}

/**
 * Create a promised component
 *
 * @param loader
 * @returns {()=>Promise<TComponent>}
 */
export function makePromisedComponent(loader:TComponentLoader): TPromisedComponentLoader {
	return function() {
		const
			resolver = Promise.defer()
		
		loader(resolver)
		
		return resolver.promise as Promise<TComponent>
	}
}


export function benchmarkLoadTime(to:string) {
	/**
	 * Tron logging window load time
	 */
	const
		startLoadTime:number = (window as any).startLoadTime,
		loadDuration = Date.now() - startLoadTime
	
	log.tron(`${to} took ${loadDuration / 1000}s`)
}