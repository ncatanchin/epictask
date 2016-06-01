import * as React from 'react'
//import {AppBar} from "material-ui";
import {IAuthState} from '../actions/auth/AuthState'
import {AuthActionFactory} from '../actions/auth/AuthActionFactory'
import {getStore} from '../store/AppStore'


const styles = require('./HeaderComponent.scss')
const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()


export interface IHeaderProps {
	className:string
}

/**
 * The app header component, title/logo/settings
 */
@CSSModules(styles)
export class HeaderComponent extends React.Component<IHeaderProps,any> {

	/**
	 * Create a new header component
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
	}


	render() {
		const state = authActions.state
		const theme = getTheme()

		const {titleStyle,style,controlStyle} = theme.navBar

		const height = style.height


		return <div className={`${this.props.className + ' ' + styles.header}`} style={style}>
			<div styleName='window-controls'>
				<button className="close fa fa-times" style={controlStyle} />
				<button className="min fa fa-minus" style={controlStyle}/>
				<button className="max fa fa-plus" style={controlStyle}/>
			</div>
			<div styleName="space">
			</div>
			<div  styleName="logo">
				<img src={require('assets/images/epictask-logo.png')}/>
				{/*// <div styleName="title" style={titleStyle}>*/}
					{/**/}
				{/*</div>*/}
			</div>
		</div>
	}
}


