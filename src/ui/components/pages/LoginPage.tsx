import * as React from 'react'
const log = getLogger(__filename)

import {RaisedButton,FlatButton,FontIcon} from 'material-ui'
import {Page} from './Page'
import {GitHubConfig} from "shared/config/GithubConfig"
import { getAuthActions } from "shared/actions/ActionFactoryProvider"
import { Themed } from "shared/themes/ThemeManager"
import { PureRender } from "ui/components/common"

const styles = {
	page: makeStyle(FlexColumnCenter,FlexScale,{
		// WebkitAppRegion: 'drag'
	}),

	panel: makeStyle(FlexAuto,FlexColumn,{

	}),

	logo: makeStyle({
		maxWidth: '80vw',
		height: 'auto',
		paddingBottom: '5vh'
	}),

	label: makeStyle({
		fontSize: '2rem',
		textTransform: 'none'
	}),

	icon:  makeStyle({
		paddingRight: '2rem',
		fontSize: '6rem',
		textTransform: 'none'
	})
}

interface ILoginPageProps {
	theme?:any
}


/**
 * LOGIN PAGE
 */
@Themed
@PureRender
export class LoginPage extends React.Component<ILoginPageProps,any> {

	constructor(props, context) {
		super(props, context)
	}


	startAuth = () => {
		const
			authActions = getAuthActions(),
			GitHubOAuthWindow = require('main/auth/GitHubOAuthWindow').default,
			authRequest = new GitHubOAuthWindow(GitHubConfig)
		
		authActions.setAuthenticating(true)
		
		// Start authentication
		authRequest.startRequest(function(err,token) {
			authActions.setAuthResult(err,token)
		})
	}
	
	render() {
		const
			{props} = this,
			{theme} = props,
			{palette} = theme,

			pageStyle = makeStyle(styles.page,{
				backgroundColor: palette.accent4Color,
				color: palette.accent4ColorText
			}),



			buttonStyle = makeStyle(styles.label,{
				border: `0.1rem solid ${palette.accent4ColorText}`,
				borderRadius: '0.2rem',
				padding: '1rem',
				height: 'auto',
				color: palette.textColor
			})

		return (
			<Page style={pageStyle} id='loginPage'>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<div style={styles.panel}>
					<img style={styles.logo}
					     src={require('assets/images/epictask-logo-rainbow.png')}/>
					<FlatButton
						style={buttonStyle}
						hoverColor={palette.accent3Color}
						onClick={this.startAuth}>

						<div style={makeStyle(FlexRowCenter)}>
							<span className='fa' style={styles.icon}>{'\uf09b'}</span>
							<span style={styles.label}>Login</span>
						</div>
					</FlatButton>

				</div>
			</Page>
		)
	}
}


