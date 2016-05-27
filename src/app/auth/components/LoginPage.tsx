import * as React from 'react'
import {Link} from 'react-router'
import {RaisedButton,FontIcon} from 'material-ui'
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
	}

	render() {

		return (
			<div styleName="loginPage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<RaisedButton
					label="Authenticate GitHub"
					primary={true}
					onMouseUp={this.login.bind(this)}
					icon={<FontIcon className="fa fa-github" />}
				/>

			</div>
		)
	}
}


