
const log =getLogger(__filename)

/**
 * Primarily for dev - create a proxy to a class
 * allowing hot reloading
 */
interface ProxyProvider {
	name:string
	newConstructor:(...args:any[]) => any
	target:any
	rev:number
}

/**
 * All existing proxy providers
 */
const proxiedProviders:{[name:string]:ProxyProvider} = {}


/**
 * Provided registers the class when
 * loaded with the built in container and
 * wraps it in a proxy when used in development
 * environment
 *
 * @param newTarget
 */
export function Provided<T>(newTarget:T):T {
	
	// Get the name first
	const {name} = newTarget as any
	
	// Not dev then just bind it
	if (!Env.isDev) {
		Container.bind(newTarget as any).provider({
			get() {
				return new (newTarget as any)()
			}
		})
		
		return newTarget
	}
	
	
	
	log.debug(`Checking proxy provider for ${name}`)
	
	/**
	 * Get provider if exists
	 */
	const getProvider = () => proxiedProviders[name]
	
	
	// Try and find existing
	let provider = getProvider()
	
	
	// Create if first load
	if (provider) {
		log.debug(`Updating existing provider for ${name}`)
		provider.target = newTarget
		provider.rev++
		provider.newConstructor.prototype = (newTarget as any).prototype
	} else {
		log.debug(`Creating provider for ${name}`)
		provider = proxiedProviders[name] = {
			name,
			target: newTarget,
			rev: 1,
			newConstructor: null
		}
		
		
		const realConstructor = function (...constructArgs) {
			let baseInstance
			
			const makeInstance = () => {
				baseInstance = new (provider.target)(...constructArgs)
				baseInstance.$$rev = provider.rev //updateInstance(null,...constructArgs)
				return baseInstance
			}
			
			baseInstance = makeInstance()
			
			return new Proxy(baseInstance, {
				get: function (fooTarget, prop) {
					//log.debug('intercepted',prop)
					
					if (baseInstance.$$rev !== provider.rev) {
						makeInstance()
					}
					return baseInstance[prop]
				}
			})
		}
		
		
		// Used to name the function - revisit at some-point
		let newConstructor:any = {}
		eval(`newConstructor = function ${name}(...newArgs) { return realConstructor(...newArgs) }`)
		
		provider.newConstructor = newConstructor
		newConstructor.prototype = (newTarget as any).prototype
		
		
		
		
	}
	
	Object
		.keys(newTarget)
		.filter(it => !['prototype','__proto__','name','constructor'].includes(it))
		.forEach(it => provider.newConstructor[it] = newTarget[it])
	
	//log.debug(`Object keys`, Object.keys(newTarget).join(', '))
	return provider.newConstructor as any
	
	
	
}