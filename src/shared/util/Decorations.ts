import {JSONKey} from 'shared/Constants'
import {isNil} from 'shared/util/ObjectUtil'


const log = getLogger(__filename)

/**
 * Keep track of annotated property values
 *
 * @type {WeakMap<any, any>}
 */
const propertyMap = new WeakMap()

function getProps(target) {
	let props = propertyMap.get(target)
	if (!props) {
		propertyMap.set(target, (props = {}))
	}

	return props
}

/**
 * OnChange function type
 */
export type OnChangeFn  = (propertyKey:string, newVal:any) => any


export interface ConfigurePropertyOptions {
	enumerable?:boolean
	onChange?:OnChangeFn
	jsonInclude?:boolean
}

/**
 * Adds a set listener
 *
 * Property is called with the target instance as _this_ context
 *
 * @returns {Function}
 * @param opts
 */
export function Property(opts:ConfigurePropertyOptions = {}):PropertyDecorator {
	return function (target:any, propertyKey:string | symbol) {

		// Get vals
		const {jsonInclude, enumerable} = opts

		// If a value for jsonInclude was provided, define
		// it in the key's metadata
		if (!isNil(jsonInclude))
			Reflect.defineMetadata(JSONKey, {jsonInclude}, target, propertyKey)


		Object.defineProperty(target, propertyKey, {
			enumerable: isNil(enumerable) ? true : enumerable,
			get: function () {
				return getProps(this)[propertyKey] as any
			},
			set: function (newVal) {
				if (getProps(this)[propertyKey] === newVal)
					return

				getProps(this)[propertyKey] = newVal
				opts.onChange && opts.onChange.call(this, propertyKey, newVal)
			}

		})
	}
}

/**
 * Primarily for dev - create a proxy to a class
 * allowing hot reloading 
 */
interface ProxyProvider {
	name:string
	newInstance:(...args:any[]) => any
	target:any

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
 */
export function Provided<T>(newTarget:T):T {
	
	// Get the name first
	const {name} = newTarget as any

	let constructor = newTarget as any
	
	/**
	 * Bind the target clazz to the provider
	 */
	function setupProvider() {
		Container.bind(constructor).provider({
			get() {
				return new constructor()
			}
		})
	}

	if (Env.isDev) {
		log.info(`Checking proxy provider for ${name}`)
		
		/**
		 * Get provider if exists
		 */
		const getProvider = () => proxiedProviders[name]
		
		// Try and find existing
		let provider = getProvider()

		// Create if first load
		if (provider) {
			log.info(`Updating existing provider for ${name}`)
			provider.target = newTarget
		} else {
			log.info(`Creating provider for ${name}`)
			provider = proxiedProviders[name] = {
				name,
				target:newTarget,
				newInstance: function(...args) {
					let baseInstance = new (getProvider().target)(...args)
					
					const getInstance = () => {
						if (baseInstance.prototype !== getProvider().target.prototype) {
							log.info(`Updating instance prototype for ${name}`)
							
							// TODO: Maybe copy own props??
							baseInstance = new (getProvider().target)(...args)
						}

						return baseInstance
					}

					return new Proxy({},{
						has: function(fooTarget,prop) {
							return getInstance()[prop]			
						},
						get: function(fooTarget,prop) {
							return getInstance()[prop]			
						},
						set: function(fooTraget,prop,val) {
							return getInstance()[prop] = val
						}
					}) 
				}
			}
		}

		constructor = provider.newInstance
	}
	
	return constructor
}