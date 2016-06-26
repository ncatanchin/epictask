import './Globals'
import * as Immutable from 'immutable'
import {isFunction,Enumerable,EnumerableProperty} from "./util"

const log = getLogger(__filename)

const PropertyTypeMapKey = Symbol('typemutant:property-type-map-key')

const finalClazzMap = new WeakMap<any,any>()

function makeErrorMsg(type,msg) {
	return `${type}${(msg) ? ' ' + msg : ''}`
}

/**
 * Not mutable error, when an object is not in
 * mutation phase
 */
export class NotMutableError extends Error {
	constructor(msg:string = null) {
		super(makeErrorMsg('NotMutableError',msg))
	}
}


/**
 * Decorate a model, required for auto-magic immutability
 *
 * @param opts
 * @returns {function(any): undefined}
 * @constructor
 */
export function RecordModel(opts = {}) {
	return function(constructor:Function) {
		//Reflect.defineMetadata('test',target,{hello:'hello'})
		const targetType = Reflect.getOwnMetadata('design:type',constructor)
		log.info('Decoratoring Mutant:',constructor,targetType)
		Reflect.defineMetadata('db:mutant',constructor,{isMutant:'true'})
	}
}

/**
 * Decorate a model property
 *
 * @param opts
 * @returns {function(any, string): undefined}
 * @constructor
 */
export function RecordProperty(opts = {}) {
	return function(target:any,propertyKey:string) {
		const propType = Reflect.getMetadata('design:type',target,propertyKey)

		if (propType) {
			const propTypeMap = Reflect.getMetadata(PropertyTypeMapKey,target) || {}
			propTypeMap[propertyKey] = propType
			Reflect.defineMetadata(PropertyTypeMapKey,propTypeMap,target)
			log.debug(`Decorated ${propertyKey} on ${target.constructor.name} with type ${propType.name}`)
		} else {
			log.warn(`Decorated property ${propertyKey} without type data on ${target.constructor.name}`)
		}


	}
}


/**
 * Typed constructor for models
 */
export interface RecordModelConstructor<T> extends Function {
	new (props?:any): T
	new ():T
	fromJS(o:any):T
	//new (...args:any[]):T;
}


/**
 * Mutator function type
 */
export type Mutator<T> = (obj:T) => T


/**
 * Creates mixed types
 *
 * I take no credit for the brilliance in this
 *
 * look in file header for credits
 */

export class RecordTypeWrapper<T, TType extends RecordModelConstructor<T>> {


	/**
	 * Create a new RecordTypeWrapper passing the same type twice
	 * _type = for the instance type, typeof
	 * dupe = the static type, should be identical
	 * @param _type
	 * @param dupe
	 */
	constructor(private _type:new () => T, dupe: TType = undefined) {}

	/**
	 * Return instance type
	 *
	 * @returns {any}
	 */

	get asType(): T {
		return <any>this._type;
	}


	/**
	 * Return the static type
	 *
	 * @returns {any}
	 */
	get asStaticType(): TType {
		return <any>this._type;
	}


	/**
	 * Mix in an additional type
	 *
	 * @param t
	 * @param dupe
	 * @returns {any}
	 */
	mixType<Z, ZType extends new () => Z> (
		t: Z,
		tc: RecordModelConstructor<Z>,
		dupe: ZType = undefined
	): RecordTypeWrapper<T & Z, RecordModelConstructor<T & Z> & TType & ZType>  {


		return <any>this;
	}




}

/**
 * Type Guard for Record object classes
 *
 * @param o
 * @returns {boolean}
 */
export function isRecordObject(o:any):o is RecordBaseObject<any,any> {
	return o.type && o.withMutation
}

/**
 * Immutable class wrapper
 */
export class RecordBaseObject<T extends any,TT extends any> {

	static fromJS(o:any) {
		return null
	}

	/**
	 * Underlying immutable js record
	 */
	record

	/**
	 * Temporary mutating property
	 * holder while operations are running
	 * this is for performance and
	 * the goal being to limit object creation
	 */

	@EnumerableProperty(false)
	recordMutating

	/**
	 * Current object mutable
	 *
	 * @type {boolean}
	 */
	@EnumerableProperty(false)
	private mutable = false



	@EnumerableProperty(false)
	typeClazz

	@EnumerableProperty(false)
	modelClazz

	@EnumerableProperty(false)
	propTypeMap

	@EnumerableProperty(false)
	recordType



	/**
	 * Is the current instance mutable
	 *
	 * @returns {boolean}
	 */
	@Enumerable(false)
	get isMutable() {
		return this.mutable
	}




	/**
	 * Empty constructor for typing purposes
	 */
	//constructor()

	/**
	 * Real constructor
	 *
	 * @param typeClazz - the RecordTypeWrapper asType
	 * @param finalClazz - ref to this constructor
	 * @param modelClazz - the underlying model class
	 * @param propTypeMap - the property map used to create the record
	 * @param recordType - the Record.Class
	 * @param props - initial properties
	 */
	constructor(
		typeClazz?:{new():TT},
		finalClazz?:any,
		modelClazz?:{new():T},
		propTypeMap?,
		recordType?:Immutable.Record.Class,
		record?:any
	){

		this.typeClazz = typeClazz
		this.modelClazz = modelClazz
		this.propTypeMap = propTypeMap
		this.recordType = recordType

		// Final clazz MUST be hidden in the constructor so that
		// clone understands its type
		// Object.defineProperty(this,'finalClazz',{
		// 	enumerable: false,
		// 	value: finalClazz
		// })

		this.record = record
		// if (props && props instanceof recordType) {
		// 	this.record = props
		// } else if (!this.record) {
		// 	this.record = new recordType(props)
		// }

	}


	/**
	 * Type of class, type guards, instance of,
	 * etc, etc
	 *
	 * @returns {string}
	 */
	get type() {
		return typeof this.typeClazz
	}

	/**
	 * withMutation - used by every helper method
	 *
	 * @param mutator
	 * @returns {RecordBaseObject}
	 */
	withMutation(mutator:Mutator<TT>):TT {
		const newRecord = this.record.withMutations((recordMutating:this) => {
			this.mutable = true
			this.recordMutating = recordMutating

			const result = mutator(this as any)
			this.mutable = false
			this.recordMutating = null
			return result
		})

		return ((newRecord === this.record) ?
			this :
			this.clone(newRecord))

	}

	/**
	 * Set a field with property key
	 *
	 * @param propertyKey
	 * @param newValue
	 * @returns {any}
	 */
	set(propertyKey,newValue):TT {
		return this.withMutation(instance => {

			instance[propertyKey] = newValue
			return instance
		}) as any
	}

	/**
	 * Clone an instance, remember, you will not
	 * have the original model in the prototype chain
	 *
	 * @param newRecord
	 * @returns {any}
	 */
	clone(newRecord = null) {

		return null
	}

	toJS() {
		return this.record.toJS()
	}

}


export function makeRecordType<T>(modelClazz:{new():T}) {
	type mixedRecordType = RecordModelConstructor<T> & RecordBaseObject<T,T> & RecordModelConstructor<RecordBaseObject<T,T>>
	return new RecordTypeWrapper(modelClazz,modelClazz as mixedRecordType)
		.mixType(RecordBaseObject,RecordBaseObject)
}

/**
 * Create an immutable version of the
 * class provided by merging types
 *
 * https://github.com/shlomiassaf - this dude is AWESOME
 * solved with https://github.com/Microsoft/TypeScript/issues/7934
 *
 * @param modelClazz
 * @param defaultProps
 * @returns {modelClazz & RecordBaseObject<T>}
 */
export function makeRecord<T extends Object>(modelClazz:{new():T},defaultProps = {}):T & RecordBaseObject<T,T> & RecordModelConstructor<T> {

	const typeWrapper = makeRecordType(modelClazz)

	 /**
	 * Create the anonymous class that implements the
	 * ComposedRecordType
	 *
	 * @returns {any}
	 */
	const propTypeMap = Reflect.getMetadata(PropertyTypeMapKey, modelClazz.prototype)
	if (!propTypeMap)
		throw new Error('No annotated property metadata was found - make sure you have @Model and @Property')


	// Create an instance of the defaults
	const modelInstance = new modelClazz()


	// Map only the defaults
	const propNames = Object.keys(propTypeMap)
	const recordDefaults = propNames
		.reduce((recordDefaults, propKey) => {
			recordDefaults[propKey] = modelInstance[propKey]
			return recordDefaults
		}, {})


	// Create an ImmutableRecordClass
	const recordType = Immutable.Record(recordDefaults)

	function createRecord(props) {
		if (props instanceof recordType)
			return props

		const setProps = Object.assign({},defaultProps,props)

		let record = new recordType().withMutations((record) => {
			Object
				.keys(setProps)
				.filter(key => propNames.includes(key))
				.forEach(key => record = record.set(key,setProps[key]))
		})

		return record
	}


	// Build the final class
	const newClazz = class RecordClazz extends RecordBaseObject<T,T> {

		static fromJS(o:any) {
			return null
		}

		constructor()
		constructor(props:any = {}) {
			super(
				typeWrapper.asStaticType,
				newClazz,modelClazz,
				propTypeMap,
				recordType,
				createRecord(props)
			)
		}
	}

	/**
	 * Override the hydration function
	 *
	 * @type {any}
	 */
	const newClazzAny = newClazz as any
	newClazzAny.fromJS = function(o:any) {
		return new newClazzAny(o)
	}



	// Map all the functions first
	Object.getOwnPropertyNames(modelClazz.prototype)
		.filter(propName => propName !== 'constructor' && isFunction(modelClazz.prototype[propName]))
		.forEach(funcName => {
			log.debug(`Defining function "${modelClazz.name}.${funcName}"`)
			newClazz.prototype[funcName] = modelClazz.prototype[funcName]
		})


	Object.keys(propTypeMap)
		.forEach(propName => {
			log.debug(`Defining property "${modelClazz.name}.${propName}"`)


			Object.defineProperty(newClazz.prototype, propName, {
				configurable: false,
				enumerable:true,

				/**
				 * Getter for annotated property
				 * - if this.isMutable, the mutating record
				 *      is used
				 * - otherwise the non mutating record is used
				 * @returns {any}
				 */
				get: function () {
					return (this.isMutable) ?
						this.recordMutating[propName] :
						this.record[propName]
				},

				/**
				 * Setter for @RecordProperty
				 * - sets mutating value, error if not mutating
				 * @param newVal
				 * @throws NotMutableError if not mutating - duh
				 */
				set: function (newVal) {
					if (!this.isMutable)
						throw new NotMutableError(`${modelClazz.name}.${propName}`)


					//throw new MutationRequiresSetterError()
					this.recordMutating[propName] = newVal
				}
			})
		})

	// Create a map entry for new instances
	//finalClazzMap.set(recordType,newClazz)

	newClazzAny.prototype.clone = (newRecord = null) => {
		return new newClazzAny(newRecord)
	}

	//return newClazz as T & RecordBaseObject<T,T> & RecordModelConstructor<T>
	const typeWrapper2 = new RecordTypeWrapper(newClazz,newClazz)
		.mixType(modelClazz,newClazz,modelClazz)
	//
	//type newClazzType = typeof typeWrapper2.asType
	return typeWrapper2.asStaticType as any
	//
	// //
	// //
	// return typeWrapper2.asStaticType as T & RecordBaseObject<T,T> & RecordModelConstructor<T>
	//return newClazz as T & RecordBaseObject<T,T> & RecordModelConstructor<T>
	//
	//
	// return makeClazz()

	//return modelClazz as T & RecordBaseObject<T,T> & RecordModelConstructor<T>
}
