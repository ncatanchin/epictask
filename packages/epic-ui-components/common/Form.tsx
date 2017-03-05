// Imports
import filterProps from 'react-valid-props'
import { List } from "immutable"
import { PureRender } from 'epic-ui-components/common/PureRender'
import { WorkIndicator } from 'epic-ui-components/common/WorkIndicator'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'

import { getValue, isString, isFunction, isPromise } from "typeguard"
import { guard } from "epic-global"
import { EnumEventEmitter } from 'type-enum-events'
import * as React from "react"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	/**
	 * Root FORM style
	 */
	return [ FlexColumn, FlexAuto, {
		
		/**
		 * Saving style
		 */
		indicator: [ {
			opacity: 1,
			background,
			pointerEvents: 'none'
		} ]
		
	} ]
}

/**
 * Declare global form field
 */

declare global {
	
	/**
	 * On validate, either returns an error string or true if valid
	 */
	interface IFormFieldValidator {
		(value:any, errorMessage:string):string | true
	}
	
	/**
	 * Form field props
	 */
	interface IFormFieldProps extends IThemedAttributes {
		
		/**
		 * Error Message override
		 */
		errorMessage?:string
		
		/**
		 * Validators
		 */
		validators?:IFormFieldValidator[]
		
		
		/**
		 * Error text formatted
		 *
		 * @param errorText
		 */
		errorFormatter?:(errorText:string) => string
	}
	
	
	interface IFormFieldConstructor {
		new (props, context):IFormField
	}
	
	/**
	 * Form field itself
	 */
	interface IFormField {
		props:IFormFieldProps
		
		setValid(valid:boolean, errors:string[]):any
		
		isValid():boolean
		
		getValue():any
	}
	
	interface IForm extends Form {
		
	}
	
	interface IFormFieldValue {
		name:string
		value:any
		field:any
		valid:boolean
		validators?:IFormFieldValidator[]
		errors?:string[]
	}
	
	/**
	 * IFormState
	 */
	interface IFormState {
		working?:boolean
		valid?:boolean
		fields?:List<IFormField>
		values?:List<IFormFieldValue>
		error?:any
	}
	
}

export enum FormEvent {
	StateChanged = 1,
	Submitted,
	Valid,
	Invalid
}

/**
 * IFormProps
 */
export interface IFormProps extends IThemedAttributes {
	id:string
	
	/**
	 * Submit form on Command (mac) / Control (linux/win) + Enter
	 */
	submitOnCmdCtrlEnter?:boolean
	
	/**
	 * On submit callback
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	onValidSubmit:(form:IForm, model:any, values:IFormFieldValue[]) => Promise<any>
	
	/**
	 * Additional validator added to field validators
	 */
	
	validator?:(form:IForm, values:IFormFieldValue[]) => Promise<IFormFieldValue[]>
	
	/**
	 * On valid
	 * @param values
	 */
	onValid?:(values:IFormFieldValue[]) => any
	
	/**
	 * On invalid
	 *
	 * @param values
	 */
	onInvalid?:(values:IFormFieldValue[]) => any
	
	
	/**
	 * Submit result handler
	 * @param result
	 * @param err
	 */
	onSubmitResult?:(result:any, err:Error) => any
	
}


/**
 * Form
 *
 * @class Form
 * @constructor
 **/


@PureRender
export class Form extends React.Component<IFormProps, IFormState> {
	
	static defaultProps = {
		submitOnCmdCtrlEnter: false
	}
	
	/**
	 * Child context types
	 *
	 * @type {{form: React.Requireable<any>}}
	 */
	static childContextTypes = {
		form: React.PropTypes.object
	}
	
	events = new EnumEventEmitter(FormEvent)
	
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			working: false,
			valid: true,
			fields: List<IFormField>().asMutable(),
			values: List<IFormFieldValue>()
		}
	}
	
	
	private updateState(patch:any, onComplete?:() => any) {
		this.setState(patch, () => {
			guard(onComplete)
			
			this.events.emit(FormEvent.StateChanged, this.state)
		})
	}
	
	/**
	 * Get all fields
	 */
	get fields() {
		return this.state.fields
	}
	
	/**
	 * Get all values
	 */
	get values() {
		return this.state.values
	}
	
	/**
	 * Get all errors
	 */
	get errors() {
		return this.values.filter(it => !it.valid || getValue(() => it.errors.length, 0) > 0)
	}
	
	/**
	 * Get the form in fields
	 *
	 * @returns {{form: Form}}
	 */
	getChildContext():any {
		return {
			form: this
		}
	}
	
	/**
	 * Is working
	 *
	 * @returns {boolean|Array}
	 */
	isWorking() {
		return this.state.working
	}
	
	/**
	 *
	 * @returns {any|boolean}
	 */
	isValid() {
		return this.state.valid
	}
	
	
	/**
	 * Register field
	 *
	 * @param field
	 */
	addField(field:IFormField) {
		const
			{ fields } = this.state,
			index = fields.indexOf(field)
		
		if (index === -1)
			fields.push(field)
	}
	
	/**
	 * Remove a field
	 *
	 * @param field
	 */
	removeField(field:IFormField) {
		const
			{ fields } = this.state,
			index = fields.indexOf(field)
		
		if (index === -1)
			return
		
		fields.remove(index)
	}
	
	
	/**
	 * On field changed
	 *
	 * @param field
	 */
	onFieldChange(field:IFormField) {
		const
			{ fields } = this.state,
			index = fields.indexOf(field)
		
		assert(index !== -1, `Unknown field: ${getValue(() => field.props.name)}`)
		
		this.validate()
	}
	
	/**
	 * Get a field by name
	 * @param name
	 */
	getField(name:string) {
		return this.fields.find(it => getValue(() => [ it.props.id, it.props.name ].includes(name), false))
	}
	
	/**
	 * Get field name
	 *
	 * @param field
	 */
	getFieldName = (field:IFormField) => getValue(() => field.props.name || field.props.id, 'unknown')
	
	
	/**
	 * Get field value
	 *
	 * @param field
	 */
	getFieldValue = (field:IFormField):IFormFieldValue => {
		const
			value = field.getValue(),
			validators = field.props.validators || [],
			fieldValue = {
				field,
				value,
				name: this.getFieldName(field),
				valid: true,
				errors: [],
				validators
			}
		
		validators.forEach(validator => {
			const
				res = validator(value, field.props.errorMessage)
			
			// IF INVALID - UPDATE ERRORS
			if (res !== true) {
				fieldValue.errors.push(res)
				fieldValue.valid = false
			}
			
		})
		
		field.setValid(fieldValue.valid, fieldValue.errors)
		
		
		return fieldValue
	}
	
	
	/**
	 * Validate the form
	 */
	validate(submit = false, validSubmitOverrideFn = null) {
		try {
			const
				values = this.fields.map(this.getFieldValue) as List<IFormFieldValue>,
				valid = values.every(it => it.valid)
			
			log.debug(`Setting state valid = ${valid}`)
			this.updateState({
				valid,
				values
			}, () => {
				log.debug(`state callback`)
				
				// INVALID
				if (!valid) {
					log.warn(`not all valid`, values)
					guard(() => this.props.onInvalid(values.toArray()))
					this.events.emit(FormEvent.Invalid, values)
					return
				}
				
				
				//VALID
				guard(() => this.props.onValid(values.toArray()))
				this.events.emit(FormEvent.Valid, values)
				submit && this.startSubmit(validSubmitOverrideFn)
			})
		} catch (err) {
			log.error(`failed to validate`, err)
		}
	}
	
	/**
	 * Handles the execution of a form submit
	 */
	private submitHandler = async (validSubmitOverrideFn:Function = null) => {
		let
			result = null,
			error:Error = null
		
		try {
			this.events.emit(FormEvent.Submitted, this)
			
			const
				values = this.values,
				model = values.reduce((model, value) => {
					model[ value.name ] = value.value
					return model
				}, {} as any)
			
			const
				onValidSubmit = validSubmitOverrideFn && isFunction(validSubmitOverrideFn) ?
					validSubmitOverrideFn : this.props.onValidSubmit
			
			result = onValidSubmit(this, model, values.toArray())
			
			if (isPromise(result))
				result = await result
			
		} catch (err) {
			log.error(`Form submit failed`, err)
			error = err
		}
		
		this.updateState({
			error,
			working: false
		})
		
		guard(() => this.props.onSubmitResult(result, error))
	}
	
	/**
	 * Submit the form
	 */
	startSubmit = (validSubmitOverrideFn:Function = null) => {
		log.debug(`startSubmit()`)
		if (this.state.working) {
			return log.warn(`Already working`)
		}
		this.updateState({
			working: true
		}, () => this.submitHandler(validSubmitOverrideFn))
		
	}
	
	/**
	 * On submit - validate > submit = true
	 * @param event
	 */
	submit = (event?:React.FormEvent<any> | Function) => {
		log.debug(`Submit called`, event)
		
		if (event && !isFunction(event)) {
			event.preventDefault()
			event.stopPropagation()
		}
		
		this.validate(true, event && isFunction(event) && event)
		
		
	}
	
	/**
	 * On key down in form
	 * @param event
	 */
	onKeyDown = event => {
		log.debug(`Form key down`, event)
		
		if (event && this.props.submitOnCmdCtrlEnter) {
			if ((Env.isMac ? event.metaKey : event.ctrlKey) && event.key === 'Enter') {
				event.preventDefault()
				event.stopPropagation()
				
				this.submit()
			}
		}
	}
	
	/**
	 * Render the root form
	 *
	 * @returns {any}
	 */
	render() {
		const
			styles = mergeStyles(createStyles(baseStyles), this.props.styles, this.props.style)
		
		const
			{
				name,
				id
			} = this.props,
			{
				working
			} = this.state
		
		return <form
			{...filterProps(this.props)}
			id={id}
			name={name}
			
			onKeyDown={this.onKeyDown}
			onSubmit={this.submit}
			style={styles}>
			{this.props.children}
			{/* Saving progress indicator */}
			<WorkIndicator style={styles.indicator} open={working}/>
		</form>
		
		
	}
	
}

export namespace Form {
	
	export const Events = FormEvent
	
	/**
	 * Context for form field
	 */
	export const FormFormFieldContextTypes = {
		form: React.PropTypes.object
	}
	
	
}



