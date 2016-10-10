import * as React from 'react'


import {FlatButton} from 'material-ui'
import {Page} from './Page'
import {GitHubConfig} from "shared/config/GithubConfig"
import { getAuthActions } from "shared/actions/ActionFactoryProvider"
import { PureRender, Icon } from "ui/components/common"
import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import { makeHeightConstraint, PositionAbsolute, makeWidthConstraint, FillWindow, Fill } from "shared/themes"
import { Logo } from "ui/components/common/Logo"
import { getValue } from "shared/util/ObjectUtil"


const
	log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	page: [FillWindow,{
		// WebkitAppRegion: 'drag'
	}],

	panel: [FlexAuto,FlexColumn,{

	}],

	logo: [
		PositionAbsolute,
		{
			left: '50%',
			top: '50%',
			transform: 'translate(-50%,-50%)',
			
			spinner: [Fill,{
				//animationDuration: '6s'
			}]
		
		}
	],
	
	button: [makeTransition(['opacity','color','background-color']),PositionAbsolute,{
		left: '50%',
		top: '50%',
		transform: 'translate(-50%,-50%)',
		cursor: 'pointer',
		//border: `0.1rem solid ${palette.accent4ColorText}`,
		//borderRadius: '0.2rem',
		//height: 'auto',
		opacity: 0.7,
		backgroundColor: Transparent,
		color: palette.text.secondary,
		
		':hover': {
			opacity: 1,
			color: palette.text.primary
		}
	}],

	label: makeStyle({
		fontSize: '2rem',
		textTransform: 'none'
	}),

	icon:  makeStyle({
		paddingRight: '2rem',
		fontSize: '6rem',
		textTransform: 'none'
	})
})

export interface ILoginPageProps extends IThemedAttributes {
	
}

export interface ILoginPageState {
	logoStyle:any
	buttonStyle:any
}

/**
 * LOGIN PAGE
 */
@ThemedStyles(baseStyles)
@PureRender
export class LoginPage extends React.Component<ILoginPageProps,any> {


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
	
	private updateStyles = () => {
		const
			dim = Math.min(window.innerHeight,window.innerWidth) / 2
		
		this.setState({
			buttonStyle: makeStyle({
				fontSize: dim
			}),
			logoStyle: makeStyle(
				makeHeightConstraint(dim),
				makeWidthConstraint(dim)
			)
		})
		
	}
	
	
	componentWillMount():void {
		this.updateStyles()
		window.addEventListener('resize',this.updateStyles)
	}
	
	componentWillUnmount():void {
		window.removeEventListener('resize',this.updateStyles)
	}
	
	render() {
		const
			{props} = this,
			{theme,styles} = props,
			{palette} = theme


		return (
			<Page style={styles.page} id='loginPage'>
				
				<Logo style={makeStyle(styles.logo,getValue(() => this.state.logoStyle))}
				      eHidden={true}
				      spinnerStyle={styles.logo.spinner} />
				      
			
				<Icon
					style={makeStyle(styles.button,getValue(() => this.state.buttonStyle))}
					iconName='github'
					iconSet='fa'
					onClick={this.startAuth} />


			
			</Page>
		)
	}
}


