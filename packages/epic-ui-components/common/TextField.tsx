// Imports

import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import {
	colorAlpha, makePaddingRem, FlexAuto, FlexRow, makeTransition, FlexRowCenter,
	mergeStyles, makeMarginRem, makeBorderRem
} from "epic-styles/styles"
import filterProps from 'react-valid-props'

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [
		FlexRowCenter,
		makePaddingRem(0.7,1),
		makeTransition(['opacity','background-color','box-shadow','border-bottom']),{
			input: [
				makePaddingRem(0.6,1),
				makeMarginRem(0),
				makeBorderRem(0),
				FlexAuto,{
					outline: 0,
					
					borderBottom: `0.2rem solid ${text.disabled}`,
					boxShadow: 'none',
						
					':focus': {
						boxShadow: `0 0 0.5rem ${colorAlpha(accent.hue1,1)}`,
						borderBottom: 0
					}
				}]
			
			
		} ]
}


/**
 * ITextFieldProps
 */
export interface ITextFieldProps extends IThemedAttributes {
	
	inputStyle?:any
	errorStyle?:any
	
	error?:string
	defaultValue?:any
}

/**
 * ITextFieldState
 */
export interface ITextFieldState {
	
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
export class TextField extends React.Component<ITextFieldProps,ITextFieldState> {
	
	render() {
		const
			{
				styles,
				inputStyle,
				style,
				errorStyle,
				defaultValue = ''
			} = this.props
		
		return <div style={[styles,style]}>
			<input
				{...filterProps(this.props)}
				style={mergeStyles(styles.input,inputStyle)}
				defaultValue={defaultValue}
			
			/>
		</div>
	}
	
}