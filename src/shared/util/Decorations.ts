import {Container} from 'typescript-ioc'
import {JSONKey} from 'shared/Constants'
import {isNil} from 'shared/util/ObjectUtil'
import JobService from 'main/services/JobService'
import {IJob, Job} from 'shared/actions/jobs/JobState'


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
 * Annotation to register a job
 * on compilation
 *
 * @param target
 * @constructor
 */
export function RegisterJob(target:{new():Job}) {
	const service = Container.get(JobService)
	service.registerJob(target.name,target)
}

