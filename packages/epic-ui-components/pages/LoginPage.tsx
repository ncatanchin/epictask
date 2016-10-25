import * as React from "react"
import { Page } from "./Page"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { getAuthActions, authenticatingSelector } from "epic-typedux"
import { PureRender } from "../PureRender"
import { Icon } from "../Icon"
import {
	ThemedStyles,
	IThemedAttributes,
	makeHeightConstraint,
	PositionAbsolute,
	makeWidthConstraint,
	FillWindow,
	Fill
} from "epic-styles"
import { Logo } from "epic-ui-components/Logo"
import { getValue } from "epic-global"

const
	log = getLogger(__filename)

function baseStyles(topStyles,theme,palette) {
	const
		{text,primary} = palette
	
	return {
		page: [ FillWindow, {
			WebkitAppRegion: 'drag',
		} ],
		
		authenticating: [ {
			pointerEvents: 'none'
		} ],
		
		
		panel: [ FlexAuto, FlexColumn, {} ],
		
		logo: [
			PositionAbsolute,
			{
				left: '50%',
				top: '50%',
				transform: 'translate(-50%,-50%)',
				
				spinner: [ Fill, {
					//animationDuration: '6s'
				} ]
				
			}
		],
		
		button: [ makeTransition([ 'opacity', 'color', 'background-color' ]), PositionAbsolute, {
			left: '50%',
			top: '50%',
			transform: 'translate(-50%,-50%)',
			cursor: 'pointer',
			WebkitAppRegion: 'no-drag',
			
			//border: `0.1rem solid ${palette.accent4ColorText}`,
			//borderRadius: '0.2rem',
			//height: 'auto',
			opacity: 1,
			backgroundColor: Transparent,
			
			':hover': {}
		} ],
		
		label: [ PositionAbsolute, makeTransition('opacity'), {
			left: '50%',
			top: '50%',
			transform: 'translate(-50%,-50%)',
			opacity: 1,
			color: text.primary,
			textAlign: 'center',
			pointerEvents: 'none',
			letterSpacing: rem(1),
			//fontStyle: 'italic',
			fontWeight: 400,
			hovering: [ {
				opacity: 0
			} ]
		} ],
		
		sublabel: [ PositionAbsolute, makeTransition('opacity'), {
			left: '50%',
			top: '65%',
			transform: 'translate(-50%,-50%)',
			opacity: 0,
			color: text.primary,
			textAlign: 'center',
			pointerEvents: 'none',
			letterSpacing: rem(0.5),
			//fontStyle: 'italic',
			fontWeight: 400,
			hovering: [ {
				opacity: 1
			} ]
		} ],
		
		icon: [ PositionAbsolute, makeTransition('opacity'), {
			left: '50%',
			top: '50%',
			transform: 'translate(-50%,-50%)',
			opacity: 0,
			pointerEvents: 'none',
			textAlign: 'center',
			color: text.primary,
			hovering: [ {
				opacity: 1
			} ]
		} ]
	}
}

export interface ILoginPageProps extends IThemedAttributes {
	authenticating?:boolean
}

export interface ILoginPageState {
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
export class LoginPage extends React.Component<ILoginPageProps,any> {
	
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
			{authenticating,styles} = props,
			buttonHovering = Radium.getState(this.state,'authButton',':hover'),
			sublabelFontSize = getValue(() => this.state.buttonStyle.fontSize / 9,rem(2) as any),
			sublabelIconFontSize = getValue(() => this.state.buttonStyle.fontSize / 7,rem(3) as any)
		
			
		log.debug(`testing`)

		return (
			<Page style={makeStyle(
							styles.page)}
			      id='loginPage'>
				
				<Logo style={makeStyle(styles.logo,getValue(() => this.state.logoStyle))}
				      eHidden={true}
				      spinnerStyle={styles.logo.spinner} />
				      
			
				<div ref="authButton"
				     onClick={this.startAuth}
				     style={makeStyle(
								styles.button,
								getValue(() => this.state.buttonStyle),
								authenticating && styles.authenticating
							)}
				     >
					<Icon
						style={makeStyle(
							styles.icon,
							getValue(() => this.state.iconStyle),
							buttonHovering && styles.icon.hovering,
							authenticating && styles.authenticating
						)}
						iconName='user'
						iconSet='fa' />
					<div style={makeStyle(
							styles.label,
							//getValue(() => this.state.buttonStyle),
							{
								fontSize: getValue(() => this.state.buttonStyle.fontSize / 6,rem(2) as any)
							},
							buttonHovering && styles.label.hovering,
							authenticating && styles.authenticating
						)}>
						press
					</div>
					
					
				</div>
				<div style={makeStyle(
							styles.sublabel,
							//getValue(() => this.state.buttonStyle),
							{
								fontSize: sublabelFontSize
							},
							buttonHovering && styles.sublabel.hovering,
							authenticating && styles.authenticating
						)}>
					authenticate&nbsp;
					<Icon
						style={{fontSize: sublabelIconFontSize}}
						iconSet="fa"
						iconName="github"/>
				</div>
			
			</Page>
		)
	}
}


