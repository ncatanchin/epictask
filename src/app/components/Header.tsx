import * as React from 'react'
import {AppBar} from "material-ui";
import {AuthActionFactory} from '../auth/AuthActionFactory'
import {IAuthState} from '../auth'
import {getStore} from '../store'

const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()



export class Header extends React.Component<any,IAuthState> {

	static getInitialState() {
		return authActions.state
	}


	private observer

	constructor(props, context) {
		super(props, context)

		//this.stateChanged()


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

		return <AppBar>

			<button onClick={() => authActions.setToken('123123')}>set fake token {state.authenticated ? 'true' : 'false'}</button>
		</AppBar>
	}
}


