import * as React from 'react'
const {remote,ipcRenderer} = require('electron')
import {Link} from 'react-router'
import {RaisedButton,FontIcon} from 'material-ui'
import {AuthActionFactory} from '../AuthActionFactory'

const log = getLogger(__filename)
const {Flexbox,FlexItem} = require('flexbox-react')

const styles = require('./LoginPage.css')
const authActions = new AuthActionFactory()

/**
 * The root container for the app
 */
export class LoginPage extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	login() {
		log.info('Executing login')
		//ipcRenderer.send(AuthKey,'start')
		authActions.authenticate()

	}

	render() {

		return (
			<Flexbox flexDirection="row" justifyContent="center" minHeight="100vh" minWidth="100vw" styleName="loginPage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<FlexItem alignSelf="center">
					<RaisedButton
						label="Authenticate GitHub"
						primary={true}
						onMouseUp={this.login.bind(this)}
						icon={<FontIcon className="fa fa-github" />}
					/>

				</FlexItem>


			</Flexbox>
		)
	}
}


