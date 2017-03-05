//region Imports

import filterProps from 'react-valid-props'
import {ThemedStyles} from "epic-styles"
import { CSSHoverState } from "epic-styles"
import { colorDarken } from "epic-styles/styles"

const Ink = require('react-ink')
const tinycolor = require('tinycolor2')
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Styles
const baseStyles = (topStyles,theme,palette) => {
	
	const
		{text,accent,warn,primary,secondary,background} = palette
	
	return {
		root: [ Styles.PositionRelative,Styles.OverflowHidden,Styles.makeBorderRem(0), Styles.makeTransition(['border','background-color','color','font-size','font-weight']),Styles.makeMarginRem(0), {
			cursor: 'pointer',
			
			outline: 0,
			width: 'auto',
			textTransform: 'uppercase',
			
			borderRadius: 2,
			
		} ],
		
		// NORMAL SIZE
		normal: [makePaddingRem(0.5,1),{
			fontWeight: 300,
			fontSize: themeFontSize(1.3)
		}],
		
		// NORMAL SIZE
		warn: [makePaddingRem(0.5,1),{
			backgroundColor: warn.hue2,
			color: text.secondary,
			':hover': {
				backgroundColor: warn.hue1
			}
		}],
		
		// BIG SIZE
		big: [makePaddingRem(1,1.5),{
			fontSize: themeFontSize(1.8)
		}],
		
		flat: {
			backgroundColor: accent.hue1,//primary.hue1,
			color: text.secondary,
			':hover': {
				backgroundColor: colorDarken(accent.hue1,5)
			}
		},
		
		raised: {
			color: text.primary,
			//backgroundColor: secondary.hue1
			//backgroundColor: accent.hue2,
			backgroundColor: Transparent,
			fontWeight: 100,
			border: `0.1rem solid ${primary.hue2}`,
				
			[CSSHoverState]: {
				fontWeight: 500,
				backgroundColor: accent.hue1
			}
		},
		
		disabled: {
			color: text.hintOrDisabledOrIcon,
			backgroundColor: primary.hue1
		}
	}
}
//endrgion


//region Component Properties
/**
 * IButtonProps
 */
export interface IButtonProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	ripple?:boolean
	mode?:'flat'|'raised'|'fab'|'warn'
	sizing?:'big'|'normal'
	disabled?:boolean
}
//endregion

/**
 * Button
 *
 * @class Button
 * @constructor
 **/
@ThemedStyles(baseStyles,'button')
export class Button extends React.Component<IButtonProps,any> {

	static defaultProps = {
		ripple: true,
		mode: 'flat',
		sizing: 'normal'
	}
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}

	render() {
		const
			{ripple,mode,disabled,style,styles,sizing,children} = this.props

		const rootStyle = mergeStyles(
			styles.root,
			styles[mode],
			styles[sizing],
			(disabled) && styles.disabled,
			...(Array.isArray(style) ? style : [style])
		)

		// rootStyle[':hover'] = rootStyle[':hover'] || {
		// 	backgroundColor: tinycolor(rootStyle.backgroundColor).lighten(20).toString()
		// }

		return <button {...filterProps(this.props)} style={rootStyle}>
			{ripple && <Ink/>}
			{children}
		</button>
	}

}