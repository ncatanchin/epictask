// Imports

import { PureRender } from './PureRender'
import { ThemedStyles } from 'epic-styles'
import {
	colorAlpha, makePaddingRem, FlexAuto, FlexRow, makeTransition, FlexRowCenter,
	mergeStyles, makeMarginRem, makeBorderRem, makeHeightConstraint, rem
} from "epic-styles/styles"
import filterProps from 'react-valid-props'
import { isNil,getValue } from "typeguard"
import { FormFieldComponent } from "./FormFieldComponent"
import { guard } from "epic-global"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, alternateText,primary, accent, background } = palette,
		{fontFamily} = theme
	
	let
		tiny = require('tinycolor2'),
		[bg,fg] = tiny(text.primary).isLight() ?
			[text.secondary,alternateText.primary] :
			[alternateText.secondary,text.primary]
	
	return [
		FlexRowCenter,
		makePaddingRem(0.7,1),
		makeTransition(['opacity','background-color','box-shadow','border-bottom']),
		theme.inputBorder,{
			minHeight: rem(4.2),
			
			
			
			backgroundColor: primary.hue3,
			
			invalid: theme.inputInvalid,
			
			input: [
				theme.input,
				makePaddingRem(0.6,1),
				makeMarginRem(0),
				FlexAuto,{
					//minHeight: rem(3),
					outline: 0,
					
					backgroundColor: bg,
					color: fg,
					//borderBottom: `0.1rem solid ${colorAlpha(fg,0.1)}`,
					boxShadow: 'none',
					fontFamily,
					
					
					':focus': {
						backgroundColor: bg,
						color: fg,
						
						//borderBottom: `0.1rem solid ${colorAlpha(fg,0.3)}`,
						// borderBottom: 0
					}
				}]
			
			
		} ]
}


/**
 * ITextFieldProps
 */
export interface ITextFieldProps extends IFormFieldComponentProps {
	inputStyle?:any
	errorStyle?:any
	error?:string
	defaultValue?:any
}

/**
 * ITextFieldState
 */
export interface ITextFieldState extends IFormFieldComponentState {
	
}

/**
 * TextField
 *
 * @class TextField
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class TextField extends FormFieldComponent<ITextFieldProps,ITextFieldState> {
	
	refs:any
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	/**
	 * Get the text field value
	 *
	 * @returns {any}
	 */
	getValue(): any {
		return getValue(() => this.refs.inputField.value,this.props.value)
	}
	
	
	/**
	 * On change handler
	 *
	 * @param event
	 */
	private onChange = (event) => {
		this.validate()
		
		guard(() => this.props.onChange(event))
	}
	
	render() {
		const
			{
				styles,
				inputStyle,
				style,
				errorStyle,
				tabIndex
			} = this.props,
			
			valid = this.isValid()
			
			//inputProps = _.omit(filterProps(this.props),'value','defaultValue')
		
		//assign(inputProps,value ? {value} : {defaultValue})
		
		return <div style={[
			styles,
			style,
			!valid && styles.invalid
		]}>
			<input
				{...filterProps(_.omit(this.props,'onChange'))}
				onChange={this.onChange}
				tabIndex={isNil(tabIndex) ? 0 : tabIndex}
				ref='inputField'
				style={mergeStyles(
					styles.input,
					
					inputStyle,
					!valid && styles.invalid
				)}
			/>
		</div>
	}
	
}