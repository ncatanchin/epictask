import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { getAuthActions, authenticatingSelector } from "epic-typedux"
import { PureRender, Page, Icon } from "epic-ui-components"
import {
	ThemedStyles,
	IThemedAttributes,
	makeHeightConstraint,
	PositionAbsolute,
	makeWidthConstraint,
	FillWindow,
	Fill
} from "epic-styles"
import { colorAlpha } from "epic-styles/styles"


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
		
		label: [ CursorPointer, makeTransition('opacity'), {
			fontSize: rem(4),
			color: colorAlpha('#ffffff',0.8),
			fontWeight: 500
		} ],
		
		
		icon: [ makeTransition('opacity'), {
			color: colorAlpha('#ffffff',0.8),
			marginLeft: rem(1.5)
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
			<Page
				style={[
					Styles.Fill,
					Styles.FlexColumnCenter,
					{
						backgroundImage: `url(${require('assets/images/splash/intro-bg.png')})`
					}
				]}
				id='loginPage'>
				
				
				<img
					height="250"
					width="auto"
					src={require("assets/images/splash/e.png")}/>
				
				<div ref="authButton"
				     onClick={this.startAuth}
				     style={[FlexRowCenter,styles.label]}
				     >
					
					
					<div style={[]}>
						login via
					</div>
					<Icon
						style={[styles.icon]}
						iconSet="fa"
						iconName="github"/>
					
				</div>
				
				
			</Page>
		)
	}
}


