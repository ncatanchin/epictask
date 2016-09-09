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
