/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as Radium from 'radium'
import {connect} from 'react-redux'
import {AppKey} from 'shared/Constants'
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
		width: 'auto'
	})
}
//endrgion


//region Component Properties
/**
 * IButtonProps
 */
export interface IButtonProps extends React.DOMAttributes {
	theme?:any
	style?:any
	ripple?:boolean
}
//endregion

//region Redux State -> Props Mapper
function mapStateToProps(state) {
	const {theme} = state.get(AppKey)

	return {
		theme
	}
}
//endregion

/**
 * Button
 *
 * @class Button
 * @constructor
 **/
@connect(mapStateToProps)
@Radium
export class Button extends React.Component<IButtonProps,any> {

	static defaultProps = {
		ripple: true
	}

	constructor(props,context) {
		super(props,context)
	}

	render() {
		const {ripple,theme,style,children} = this.props

		return <button {...this.props} style={[styles.root,style]}>
			{ripple && <Ink/>}
			{children}
		</button>
	}

}