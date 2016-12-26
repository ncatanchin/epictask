// Imports

import { PureRender } from './PureRender'
import { ThemedStyles } from 'epic-styles'
import {
	colorAlpha, makePaddingRem, FlexAuto, FlexRow, makeTransition, FlexRowCenter,
	mergeStyles, makeMarginRem, makeBorderRem, makeHeightConstraint, rem, isHovering
} from "epic-styles/styles"
import filterProps from 'react-valid-props'
import { isNil, getValue } from "typeguard"
import { FormFieldComponent } from "./FormFieldComponent"
import { guard } from "epic-global"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { FormErrorTooltip } from "epic-ui-components/common/FormErrorTooltip"

// Constants
const
	log = getLogger(__filename),
	Tooltip = require('react-tooltip')

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

let
	styleSheet:IGlobalThemedStyle = null

function baseStyles(topStyles, theme, palette) {
	
	
	const
		{ text, alternateText, primary, warn, background } = palette,
		{ fontFamily } = theme
	
	let
		inputClassName = null,
		tiny = require('tinycolor2'),
		[bg,fg] = tiny(text.primary).isLight() ?
			[ text.secondary, alternateText.primary ] :
			[ background, text.primary ]
	
	
	if (styleSheet) {
		styleSheet.clean()
	}
	
	styleSheet = CreateGlobalThemedStyles((themeCopy, Style) => {
		inputClassName = Style.registerStyle({
			'&::-webkit-input-placeholder': {
				fontWeight: '300',
				[require('free-style').IS_UNIQUE]: true
				
			}
		})
		return {}
	})
	
	return [
		Styles.FlexRowCenter,
		Styles.PositionRelative,
		Styles.makePaddingRem(0.7, 1),
		Styles.makeMarginRem(0),
		theme.inputBorder,
		Styles.makeTransition([ 'opacity', 'background-color', 'box-shadow', 'border-bottom' ]),
		{
			minHeight: rem(4.2),
			
			// ERROR MODES FOR MARGINS
			['tooltip']: [],
			['message-below']: {
				marginBottom: rem(1.2)
			},
			
			backgroundColor: primary.hue3,
			
			invalid: theme.inputInvalid,
			
			// FROM FREESTYLE
			inputClassName,
			
			input: [
				theme.input,
				Styles.makePaddingRem(0.6, 1),
				Styles.makeMarginRem(0),
				FlexAuto, {
					
					
				
					outline: 0,
					
					backgroundColor: bg,
					color: fg,
					boxShadow: 'none',
					fontFamily,
					
					
					focused: {
						backgroundColor: bg,
						color: fg
					},
					
					
				} ],
			
			
			//	ERROR MESSAGE
			errorMessage: [
				Styles.PositionAbsolute,
				{
					fontWeight: 500,
					fontSize: rem(1.1),
					
					color: warn.hue1,
					
					// MODE - TOOLTIP ACCESSORY
					['tooltip']: [{
						maxWidth: "50vw",
						fontSize: rem(1.5),
						right: rem(1.5),
						top: '50%',
						height: rem(1.5),
						width: rem(1.5),
						transform: `translate(0,-50%)`,
						//minHeight: rem(3),
						
					}],
					
					// MODE - MESSAGE ON RIGHT BELOW
					['message-below']: [
						Ellipsis,
						{
							right: convertRem(1),
							bottom: 0,
							
							maxWidth: `calc(80% - ${convertRem(1)}px)`,
							transform: `translate(0,${rem(2)})`,
						} ]
				}
			
			]
			
			
		} ]
}


/**
 * ITextFieldProps
 */
export interface ITextFieldProps extends IFormFieldComponentProps {
	inputStyle?: any
	errorMode?:'message-below'|'tooltip'
	errorStyle?: any
	error?: string
	defaultValue?: any
}

/**
 * ITextFieldState
 */
export interface ITextFieldState extends IFormFieldComponentState {
	focused?: boolean
}

/**
 * TextField
 *
 * @class TextField
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'textField')
@PureRender
export class TextField extends FormFieldComponent<ITextFieldProps,ITextFieldState> {
	
	static defaultProps = {
		errorMode: 'tooltip'
	}
	
	refs: any
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			focused: false
		}
	}
	
	/**
	 * Get the text field value
	 *
	 * @returns {any}
	 */
	getValue(): any {
		return getValue(() => this.refs.inputField.value, this.props.value)
	}
	
	/**
	 * on focus
	 */
	private onFocus = event => {
		guard(() => this.props.onFocus(event))
		this.setState({ focused: true })
		
	}
	
	/**
	 * On blur
	 */
	private onBlur = event => {
		this.setState({ focused: false })
		guard(() => this.props.onBlur(event))
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
				style,
				errorStyle,
				tabIndex,
				errorMode
			} = this.props,
			focused = this.state.focused,
			hovering = isHovering(this, 'inputWrapper', 'inputField'),
			valid = this.isValid(),
			errorMessage = !valid && getValue(() => this.getErrors().join(', '), 'No errors?')
		
		
		//inputProps = _.omit(filterProps(this.props),'value','defaultValue')
		
		//assign(inputProps,value ? {value} : {defaultValue})
		log.debug(`Valid = ${valid} && Error Message = ${errorMessage}`)
		return <div
			ref="inputWrapper"
			style={[
				styles,
				styles[errorMode],
				focused && styles.focused,
				hovering && styles.hovering,
				//!valid && styles.invalid,
				style
			]}>
			<input
				{...filterProps(_.omit(this.props, 'onChange'))}
				className={styles.inputClassName}
				onChange={this.onChange}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				tabIndex={isNil(tabIndex) ? 0 : tabIndex}
				ref='inputField'
				style={[
					styles.input,
					!valid && styles.input[errorMode],
					focused && styles.input.focused,
					hovering && styles.input.hovering,
					!valid && styles.invalid,
					this.props.inputStyle
				]}
			/>
			
			{/* ERROR MESSAGE */}
			{!valid && (errorMode === 'message-below' ? <div
				style={[
					styles.errorMessage,
					styles.errorMessage['message-below'],
					errorStyle
				]}>
				{errorMessage}
			</div> :
				<div
					style={[
						styles.errorMessage,
						styles.errorMessage['tooltip']
					]}
					data-tip
				>
					<Icon style={{pointerEvents: 'none',cursor: 'pointer'}}>error</Icon>
					<FormErrorTooltip tip={errorMessage} />
				</div>)
				
			}
		</div>
	}
	
}