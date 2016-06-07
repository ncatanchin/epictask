/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Radium from 'radium'
import {connect} from 'react-redux'
import {AppKey} from 'shared/Constants'
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Styles
const styles = {
	root: makeStyle({
		cursor: 'pointer'
	})
}
//endrgion


//region Component Properties
/**
 * IButtonProps
 */
export interface IButtonProps extends React.DOMAttributes {
	theme?:any,
	style?:any
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

	constructor(props,context) {
		super(props,context)
	}

	render() {
		const {theme,style,children} = this.props

		return <div {...this.props} style={makeStyle(styles.root,style)}>
			{children}
		</div>
	}

}