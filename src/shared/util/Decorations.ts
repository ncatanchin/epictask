import {JSONKey} from 'shared/Constants'
import {isNil} from 'shared/util/ObjectUtil'
import {isFunction} from "shared/util"


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

/**
 * Boolean test types, function or primitive
 */
export type TBooleanTestFn = ()=>boolean
export type TBooleanTestTruthy = boolean | any
export type TBooleanTest =  TBooleanTestFn | TBooleanTestTruthy


/**
 * If then function call
 *
 * @param tests
 * @param fn
 * @param elseFn
 * @returns {any}
 */
export function If(tests:TBooleanTest[]|TBooleanTest,fn:Function,elseFn?:Function) {
	tests = (Array.isArray(tests) ? tests : [tests])
	
	for (let test of tests) {
		if ((isFunction(test) && !test()) || !test) {
			return elseFn ? elseFn() : false
		}
	}
	
	return fn()
}

/**
 * OnlyIf - decorate a function to only occur if n functions or
 * boolean values are true
 */
export function OnlyIf(...tests:TBooleanTest[]) {
	return (target:Function) => {
		return function(...args:any[]) {
			return If(tests,function() {
				return target.apply(this,args)
			})
		}
	}
}

/**
 * Shortcut for OnlyIf Decoration
 *
 * @param tests
 * @param fn
 */
export function OnlyIfFn(tests:TBooleanTest[]|TBooleanTest,fn:Function) {
	tests = (Array.isArray(tests) ? tests : [tests])
	return OnlyIf(...tests)(fn)
}


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
		provider.rev++
		provider.newConstructor.prototype = (newTarget as any).prototype
	} else {
		log.info(`Creating provider for ${name}`)
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
					//log.info('intercepted',prop)
					
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
		
		Container
			.bind(newConstructor)
			.provider({
				get: () => {
					return new newConstructor()
				}
			})
	}
	
	return provider.newConstructor as any
	
	
	
}