import * as React from 'react'
import {dialog} from 'electron'
import {Link} from 'react-router'
import {RaisedButton,FontIcon} from 'material-ui'
import {GitHubConfig} from 'shared/Constants'
const log = getLogger(__filename)
const {Flexbox,FlexItem} = require('flexbox-react')
const styles = require('./LoginPage.css')

/**
 * The root container for the app
 */
export class LoginPage extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	login() {
		log.info('Executing login')

		const OAuthGithub = require('electron-oauth-github')
		const authRequest = OAuthGithub(GitHubConfig)

		authRequest.startRequest(function(accessToken, err) {
			if (err) {
				log.error(err);
			}

			dialog.showErrorBox('Status', 'access_token: ' + accessToken);
		});
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


