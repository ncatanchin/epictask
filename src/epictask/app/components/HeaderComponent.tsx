import * as React from 'react'
//import {AppBar} from "material-ui";
import {IAuthState} from '../actions/auth/AuthState'
import {AuthActionFactory} from '../actions/auth/AuthActionFactory'
import {getStore} from '../store/AppStore'


const styles = require('./HeaderComponent.css')
const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()


/**
 * The app header component, title/logo/settings
 */
@CSSModules(styles)
export class HeaderComponent extends React.Component<any,IAuthState> {

	/**
	 * Sets the default state to
	 * the current authentication state
	 *
	 * @returns {any}
	 */
	static getInitialState() {
		return authActions.state
	}

	/**
	 * Observer reference
	 */
	private observer

	/**
	 * Create a new header component
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
	}



	stateChanged() {
		log.info('State change triggered')
		this.setState(authActions.state)

	}


	componentWillMount():void {
		this.observer = store.observe(authActions.leaf(),this.stateChanged.bind(this))
	}

	componentWillUnmount():void {
		if (this.observer) {
			this.observer()
			this.observer = null
		}
	}

	render() {
		const state = authActions.state
		const theme = getTheme()

		const {titleStyle,style} = theme.navBar


		return <div styleName='header' style={style}>
			<div styleName="title" style={titleStyle}>GITTUS</div>
		</div>
	}
}


