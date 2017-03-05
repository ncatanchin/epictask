import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { getAuthActions, authenticatingSelector } from "epic-typedux"
import { PureRender, Page, Icon, Button } from "epic-ui-components"
import {
	ThemedStyles,
	IThemedAttributes,
	makeHeightConstraint,
	makeWidthConstraint
} from "epic-styles"
import { colorAlpha } from "epic-styles/styles"

import * as React from "react"

const
	log = getLogger(__filename)






function baseStyles(topStyles, theme, palette) {
	const
		{text,primary} = palette
	
	return {
		page: [
			Styles.Fill,
			Styles.FlexColumnCenter,{
				WebkitAppRegion: 'drag',
				backgroundImage: `url(${require('assets/images/splash/intro-bg.png')})`
			}
		],
		
		
		authenticating: [ {
			pointerEvents: 'none'
		} ],
		
		
		loginButton: [ Styles.FlexAuto, {
			// left: '50%',
			// top: '50%',
			// transform: 'translate(-50%,-50%)',
			cursor: 'pointer',
			WebkitAppRegion: 'no-drag',
			fontSize: rem(1.6),
			//border: `0.1rem solid ${palette.accent4ColorText}`,
			//borderRadius: '0.2rem',
			//height: 'auto',
			// opacity: 1,
			// backgroundColor: Transparent,
			
			':hover': {}
		} ],
		
		
		githubIcon: [ Styles.makeTransition('opacity'), Styles.FlexAuto, Styles.makePaddingRem(3),{
			color: colorAlpha('#ffffff',0.8),
			fontSize: '200px'
		} ]
	}
}


export interface ILoginRootProps extends IThemedAttributes {
	authenticating?:boolean
}

export interface ILoginRootState {
	logoStyle:any
	buttonStyle:any
	iconStyle:any
}

/**
 * LOGIN PAGE
 */
@connect(createStructuredSelector({
	authenticating: authenticatingSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class LoginRoot extends React.Component<ILoginRootProps,any> {
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	/**
	 * Show the auth popup
	 *
	 */
	startAuth = () => {
		
		
		getAuthActions().startAuth()
		
		// Start authentication
		
	}
	
	private updateStyles = () => {
		const
			dim = Math.min(window.innerHeight,window.innerWidth) / 5
		
		this.setState({
			buttonStyle: makeStyle(
				makeHeightConstraint(dim),
				makeWidthConstraint(dim),
				{
					fontSize: dim
				}
			),
			iconStyle: makeStyle(
				// makeHeightConstraint(dim),
				// makeWidthConstraint(dim),
				{
					fontSize: dim / 2
				}
			),
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
			{authenticating,styles} = props
			
		log.debug(`testing`)

		return (
			<Page id='loginPage' style={styles.page}>
				
				
				
				{/*<img*/}
					{/*height="250"*/}
					{/*width="auto"*/}
					{/*src={require("assets/images/splash/e.png")}/>*/}
				
				<Icon
					style={styles.githubIcon}
					iconSet="fa"
					iconName="github"/>
				
				<Button ref="authButton" mode="flat" onClick={this.startAuth} style={styles.loginButton}>
					Sign in
				</Button>
				
				
			</Page>
		)
	}
}


