// Imports
import {  Form } from './Form'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getValue } from "typeguard"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}



/**
 * IFormFieldComponentState
 */
declare global {
	
	/**
	 * IFormFieldComponentProps
	 */
	interface IFormFieldComponentProps extends IThemedAttributes,IFormFieldProps {
		
	}
	
	
	interface IFormFieldComponentState {
		formListener?:any
		valid?:boolean
		errors?:string[]
	}
}

/**
 * FormFieldComponent
 *
 * @class FormFieldComponent
 * @constructor
 **/
export class FormFieldComponent<P extends IFormFieldComponentProps,S extends IFormFieldComponentState>
extends React.Component<P,S> implements IFormField {
	
	/**
	 * Context types
	 */
	static contextTypes = Form.FormFormFieldContextTypes
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			valid: true,
			errors: []
		} as any
	}
	
	/**
	 * Get form
	 */
	get form():IForm {
		return this.context.form
	}
	
	/**
	 * Validate this field
	 *
	 * @returns {boolean}
	 */
	validate() {
		const
			fieldValue = getValue(() => this.form.getFieldValue(this))
		
		log.debug(`Validated field`, fieldValue)
		
		if (!fieldValue)
			return true
		
		const
			{valid,errors} = fieldValue
		
		this.setState({valid,errors} as any)
		
		return valid
	}
	
	/**
	 * getErrors
	 *
	 * @returns {Array}
	 */
	getErrors():string[] {
		return getValue(() => this.state.errors,[])
	}
	
	/**
	 * setValid
	 *
	 * @param valid
	 * @param errors
	 */
	setValid(valid:boolean,errors:string[]) {
		this.setState({valid,errors} as any)
	}
	
	/**
	 * Is field valid
	 */
	isValid() {
		return getValue(() => this.state.valid,true)
	}
	
	/**
	 * Get value
	 */
	getValue() {
		return null
	}
	
	/**
	 * onStateChange
	 *
	 * @param formState
	 */
	private onStateChanged = (formState:IFormState) => {
		
	}
	
	/**
	 * Component will mount
	 */
	componentWillMount() {
		if (this.form) {
			
			this.form.addField(this)
			
			this.setState({
				formListener:this.form.events.on(Form.Events.StateChanged,this.onStateChanged)
			} as any)
		}
	}
	
	/**
	 * Component unmount
	 */
	componentWillUnmount() {
		const
			formListener = getValue(() => this.state.formListener)
		
		if (this.form) {
			this.form.removeField(this)
		}
		
		if (formListener) {
			formListener()
			
			this.setState({
				formListener:null
			} as any)
		}
	}
	
	/**
	 * Render
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ styles } = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}