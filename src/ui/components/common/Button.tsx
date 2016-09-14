//region Imports
import * as React from 'react'
import filterProps from 'react-valid-props'
import {ThemedStyles} from 'shared/themes/ThemeManager'
const Ink = require('react-ink')
const tinycolor = require('tinycolor2')
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Styles
const baseStyles = createStyles({
	root: [PositionRelative,makeTransition('background-color'),{
		cursor: 'pointer',
		border: 0,
		padding: '0.5rem 1rem',
		margin: 0,
		outline: 0,
		width: 'auto',
		textTransform: 'uppercase',
		// fontSize: themeFontSize(1.3)
	}]
})
//endrgion


//region Component Properties
/**
 * IButtonProps
 */
export interface IButtonProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	ripple?:boolean
	mode?:'flat'|'raised'|'fab'
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

export class Button extends React.Component<IButtonProps,void> {

	static defaultProps = {
		ripple: true,
		mode: 'flat'
	}

	render() {
		const
			{ripple,mode,disabled,style,styles,children} = this.props

		const rootStyle = mergeStyles(
			styles.root,
			styles[mode],
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