import {Attribute} from 'typestore'


import {isNil,isFunction} from "typeguard"
import {JSONKey } from './Constants'

const
	log = getLogger(__filename),
	
	//Keep track of annotated property values
	propertyMap = new WeakMap()

/**
 * Get props for a given object
 *
 * @param target
 * @returns {any}
 */
function getProps(target) {
	let
		props = propertyMap.get(target)
	
	if (!props) {
		props = {}
		propertyMap.set(target, props)
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
	
	const
		results = tests.map(test => isFunction(test) ? test() : test),
		pass = results.every(result => result !== null && result !== undefined && result !== false && result !== 0)
	return pass ? fn(...results) : elseFn ? elseFn(...results) : false
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


export interface IOneAtATimeOptions {
	waitForResult?:boolean,
	executeAgainWhenComplete?:boolean
}

const defaultOneAtATimeOpts = {
	waitForResult: true,
	executeAgainWhenComplete: false
} as IOneAtATimeOptions

export interface IOneAtATimeFn<T> {
	isPending():boolean
	pendingPromise():Promise<any>
	override(overrideOpts:IOneAtATimeOptions):T
}

export function OneAtATime<T>(moreOpts:IOneAtATimeOptions = {},target:T):T & IOneAtATimeFn<T> {
	
	const
		opts = assign(defaultOneAtATimeOpts,moreOpts)
	
	let
		pendingResult:Promise.Resolver<any>,
		waitingForNextResult = [],
		fn = null
	
	fn = ((...args:any[]) =>  {
		let
			overrideOpts = {}
		
		if (args[0] && args[0].overrideOpts) {
			overrideOpts = 	args[0].overrideOpts
			args = args[0].overrideArgs
		}
		
		const
			{
				waitForResult,
				executeAgainWhenComplete
			} = assign(opts,overrideOpts),
			
			
			deferred = Promise.defer()
		
		if (pendingResult) {
			
			// EXECUTE AGAIN WHEN THIS ITERATION CONTINUES
			if (executeAgainWhenComplete) {
				waitingForNextResult.push(waitForResult ? deferred : false)
			} else if (waitForResult && !executeAgainWhenComplete) {
				pendingResult.promise.then((result) => deferred.resolve(result))
			} else {
				deferred.resolve()
			}
			
			//return pendingResult.promise
		} else {
			pendingResult = Promise.defer()
			
			let
				thisResult = null, thisErr = null
			
			deferred.resolve((target as any)(...args)
				.then(result => {
					thisResult = result
					return result
				})
				.catch (err => {
					thisErr = err
					throw err
				})
				.finally(() => {
					// RESOLVE THIS ITERATION NO MATTER WHAT
					if (thisErr)
						pendingResult.reject(thisErr)
					else
						pendingResult.resolve(thisResult)
					
					// STEP OUT OF STACK AND RE-ENTER IF EXECUTE AGAIN
					if (waitingForNextResult.length) {
						setTimeout(() => {
							const
								oldPendingResult = pendingResult,
								waitingForThisResult = waitingForNextResult.slice().filter(it => it !== false)
							
							waitingForNextResult.length = 0
							pendingResult = null
							
							oldPendingResult
								.resolve(
									fn(...args)
										// ITERATE ALL CURRENT WAITING PROMISES & RESOLVE OR REJECT
										.then(result => {
											waitingForThisResult.forEach(it => it.resolve(result))
											return result
										})
										.catch(err => {
											waitingForThisResult.forEach(it => it.reject(err))
											throw err
										})
								)
						})
					} else {
						pendingResult = null
					}
					
				}))
			
			// pendingResult =
			// 	deferred
			// 		.promise
			// 		.catch(err => deferred.reject(err))
			// 		.finally(() => pendingResult = null)
			
			
		}
		
		return deferred.promise
	}) as any
	
	fn.isPending = () => !!pendingResult
	fn.pendingPromise = () => pendingResult
	
	// CREATES AN OVERRIDE FN WITH SPECIFIC OPTS
	fn.override = (overrideOpts:IOneAtATimeOptions):T =>
		((...args) => fn({overrideOpts,overrideArgs:args})) as any
	
	return fn as T & IOneAtATimeFn<T>
	
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
	
	const {jsonInclude, enumerable} = opts
	
	return function (target:any, propertyKey:string | symbol) {
		
		
		// If a value for jsonInclude was provided, define
		// it in the key's metadata
		if (!isNil(jsonInclude)) {
			Reflect.defineMetadata(JSONKey, { jsonInclude }, target, propertyKey)
		}
		

		Object.defineProperty(target, propertyKey, {
			enumerable: isNil(enumerable) ? true : enumerable,
			get: function () {
				return getProps(this)[propertyKey] as any
			},
			set: function (newVal) {
				let props = getProps(this)
				if (props[propertyKey] === newVal) {
					return
				}
				
				props[propertyKey] = newVal
				opts.onChange && opts.onChange.call(this, propertyKey, newVal)
			}

		})
		
		
	}
}

/**
 * Mark an attribute as transient
 *
 * @param target
 * @param propertyKey
 * @constructor
 */
export function Transient(target:any,propertyKey:string) {
	return Attribute({transient:true})(target,propertyKey)
}

/**
 * Decorate a constructor - ripped from typescript-ioc - many thx ;)
 *
 * @param derived
 * @param base
 * @returns {Function}
 */
export function decorateConstructor(derived: Function, base: Function) {
	for (let p of Object.getOwnPropertyNames(base)) {
		if (base.hasOwnProperty(p) && !derived.hasOwnProperty(p)) {
			derived[p] = base[p];
		}
	}
	derived['__parent'] = base;
	function __() { this.constructor = derived; }
	derived.prototype = base === null ? Object.create(base) :
		(__.prototype = base.prototype, new __());
	return derived;
}

