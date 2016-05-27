import * as React from 'react'
import {remote, ipcRenderer} from 'electron'
import {Link} from 'react-router'
import {RaisedButton, FontIcon} from 'material-ui'
import {GitHubConfig, AuthKey} from 'shared/Constants'
import {AuthActionFactory} from '../AuthActionFactory'
import {CircularProgress} from 'material-ui'
const log = getLogger(__filename)
const {Flexbox, FlexItem} = require('flexbox-react')

const styles = require('./VerifyLoginPage.css')
const authActions = new AuthActionFactory()

/**
 * The root container for the app
 */
export class VerifyLoginPage extends React.Component<any,any> {

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
			<Flexbox flexDirection="row" justifyContent="center" minHeight="100vh" minWidth="100vw"
			         styleName="verifyLoginPage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<FlexItem alignSelf="center">
					{/*Verify*/}
					<CircularProgress size={2} />


				</FlexItem>


			</Flexbox>
		)
	}
}


