import * as React from 'react'
const log = getLogger(__filename)
const {remote,ipcRenderer} = require('electron')
import {Link} from 'react-router'
import {RaisedButton,FontIcon} from 'material-ui'
import {AuthActionFactory} from '../../actions/auth/AuthActionFactory'
import {Page} from '../common'

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


	render() {

		return (
			<Page styleName="loginPage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<FlexItem alignSelf="center">
					<RaisedButton
						label="Authenticate GitHub"
						primary={true}
						onMouseUp={() => authActions.authenticate()}
						icon={<FontIcon className="fa fa-github" />}
					/>

				</FlexItem>
			</Page>
		)
	}
}


