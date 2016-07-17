/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as Radium from 'radium'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import {Themed} from 'shared/themes/ThemeManager'
const Ink = require('react-ink')
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Styles
const styles = {
	root: makeStyle(PositionRelative,{
		cursor: 'pointer',
		border: 0,
		padding: '0.5rem 1rem',
		margin: 0,
		outline: 0,
		width: 'auto',
		textTransform: 'uppercase',
		fontSize: themeFontSize(1.3)
	})
}
//endrgion


//region Component Properties
/**
 * IButtonProps
 */
export interface IButtonProps extends React.HTMLAttributes {
	theme?:any
	style?:any
	ripple?:boolean
	mode?:'flat'|'raised'|'fab'
	disabled?:boolean
}
//endregion

//region Redux State -> Props Mapper
function mapStateToProps(state) {
	return {
		theme: getTheme()
	}
}
//endregion

/**
 * Button
 *
 * @class Button
 * @constructor
 **/
@Radium
@Themed
export class Button extends React.Component<IButtonProps,any> {

	static defaultProps = {
		ripple: true,
		mode: 'flat'
	}

	constructor(props,context) {
		super(props,context)
	}

	render() {
		const
			{ripple,theme,mode,disabled,style,children} = this.props,
			s = mergeStyles(styles,theme.button)


		const rootStyle = mergeStyles(s.root,s[mode],(disabled) && s.disabled,style)
		//{ripple && <Ink/>}
		return <button {...filterProps(this.props)} style={rootStyle}>
			{children}
		</button>
	}

}