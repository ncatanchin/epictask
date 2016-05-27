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


	render() {

		return (
			<div styleName="loginPage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<RaisedButton
					label="Github Link"
					linkButton={true}
					href="https://github.com/callemall/material-ui"
					primary={true}
					icon={<FontIcon className="fa fa-github" />}
				/>

			</div>
		)
	}
}


