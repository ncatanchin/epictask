// Imports

import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import {
	colorAlpha, makePaddingRem, FlexAuto, FlexRow, makeTransition, FlexRowCenter,
	mergeStyles, makeMarginRem, makeBorderRem, makeHeightConstraint, rem
} from "epic-styles/styles"
import filterProps from 'react-valid-props'

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
		
		makeTransition(['opacity','background-color','box-shadow','border-bottom']),{
			minHeight: rem(4.2),
		
			input: [
				makePaddingRem(0.6,1),
				makeMarginRem(0),
				makeBorderRem(0),
				FlexAuto,{
					minHeight: rem(3),
					outline: 0,
					
					backgroundColor: bg,
					color: fg,
					borderBottom: `0.1rem solid ${colorAlpha(fg,0.1)}`,
					boxShadow: 'none',
					fontFamily,
					
					
					':focus': {
						backgroundColor: bg,
						color: fg,
						
						boxShadow: `0 0 0.5rem ${colorAlpha(accent.hue1,1)}`,
						borderBottom: `0.1rem solid ${colorAlpha(fg,0.3)}`,
						// borderBottom: 0
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
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	render() {
		const
			{
				styles,
				inputStyle,
				style,
				errorStyle
			} = this.props
			
			//inputProps = _.omit(filterProps(this.props),'value','defaultValue')
		
		//assign(inputProps,value ? {value} : {defaultValue})
		
		return <div style={[styles,style]}>
			<input
				{...filterProps(this.props)}
				ref='inputField'
				style={mergeStyles(styles.input,inputStyle)}
			/>
		</div>
	}
	
}