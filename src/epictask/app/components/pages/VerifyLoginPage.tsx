const log = getLogger(__filename)

import * as React from 'react'
import {AuthActionFactory} from '../../actions/auth/AuthActionFactory'
import {CircularProgress} from 'material-ui'
const {Flexbox, FlexItem} = require('flexbox-react')

const styles = require('./VerifyLoginPage.css')
const authActions = new AuthActionFactory()

/**
 * The root container for the app
 */
export class VerifyLoginPage extends React.Component<any,any> {


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


