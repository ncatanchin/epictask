import * as React from "react"
import { SearchField } from "epic-ui-components/search"
import { makeAbsolute, makeHeightConstraint, ThemedStyles, IThemedAttributes } from "epic-styles"
import { TextField } from "material-ui/TextField"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from  "epic-command-manager-ui"
import {
	getCommandManager,
	ContainerNames
} from "epic-command-manager"
import { CommandMenuRoot } from "epic-ui-components/layout/ide/CommandMenuRoot"
import { WindowControls,RainbowIndicator,PureRender } from "epic-ui-components/common"

export const
	ImageLogoFile = require('assets/images/epictask-logo-rainbow.png')

const
	log = getLogger(__filename)



const baseStyles = (topStyles,theme,palette) => {
	
	const
		{primary,accent,text,secondary,background} = palette
	
	return {
		header: [
			makeTransition(['height','max-height','min-height','opacity']),
			makeHeightConstraint('50px'),
			FlexRowCenter,
			FillWidth,
			FlexAuto,
			PositionRelative,
			makePaddingRem(0,0,0,10),
			{
				WebkitUserSelect: 'none',
				WebkitAppRegion: 'drag',
				border: 0,
				opacity: 1,
				
				hidden: [makeHeightConstraint('0px'),makePaddingRem(0),{
					opacity: 0
				}]
			}
		],
		
		
		
		
		controls: makeStyle(makeAbsolute(), {
			WebkitAppRegion: 'no-drag',
			opacity: 1,
			border: '0.2rem solid transparent',
			padding: 0
		}),
		
		controlButton: makeStyle(makeTransition(), FlexRowCenter, {
			display: 'inline-flex',
			border: '0.2rem solid transparent'
		}),
		
		controlButtonBefore: makeStyle(makeTransition()),
		
		logo: [
			makeTransition(['opacity']),
			//PositionAbsolute,
			{
				transform: 'scale(0.7)',
				// top: 0,
				// right: 10,
				
				spinner: [{
					animationDuration: '5s'
				}]
			}
		],
		
		
		
	}
	
}

export interface IHeaderProps extends IThemedAttributes {
	
}

export interface IHeaderState {
	searchField?:SearchField
	hotKeys?:any
	resultsHidden?:boolean
	forceBlur?:boolean
	focused?:boolean
}



/**
 * The app header component, title/logo/settings
 */
@CommandComponent()
@ThemedStyles(baseStyles,'header')
@PureRender
export default class Header extends React.Component<IHeaderProps,IHeaderState> implements ICommandComponent {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder.make()
	
	readonly commandComponentId:string = 'Header'
	
	constructor(props,context) {
		super(props,context)
	}

	get searchField():SearchField {
		const panel = _.get(this,'state.searchField') as any
		return panel && panel.getWrappedInstance ? panel.getWrappedInstance() : panel
	}

	get textField():TextField {
		return _.get(this,'searchField.textField') as any
	}




	windowClose = () => {
		log.info('window close')
	}

	windowMin = () => {
		log.info('window min')
	}

	windowMax = () => {
		log.info('window max')
	}

	setSearchFieldRef = (searchField) => {
		this.setState({searchField})
	}

	setHotKeysRef = (hotKeys) => {
		this.setState({hotKeys})
	}

	/**
	 * On escape sequence close the header unless expanded
	 */
	onEscape = () => {
		
		log.info(`Header on escape`)
		
		// if (this.textField)
		// 	this.textField.blur()
		//
		getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
		
		// const {searchField} = this
		//
		// if (searchField) {
		// 	const textField:any = searchField.textField
		// 	if (textField) {
		// 		textField.blur()
		// 	} else {
		// 		const doc = document as any
		// 		doc.activeElement.blur()
		// 	}
		// }
		
		//ActionFactoryProviders[UIKey].focusIssuesPanel()
	}

	/**
	 * onBlur - exiting find
	 *
	 * @param event
	 */

	onBlur = (event) => {
		this.setState({
			focused:false
		})
	}

	/**
	 * On focus - usually for find
	 *
	 * @param event
	 */
	onFocus = (event) => {
		this.setState({resultsHidden:false,focused:true})
	}

	keyHandlers = {}

	

	/**
	 * on mount clear the state
	 */
	componentWillMount = () => !this.state && this.setState({})

	
	
	/**
	 * Render component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{theme,styles,style} = this.props,
		
			themeHeight = theme.header.style.height

			
		
		
		const
			headerStyle = makeStyle(
				theme.header.style,
				style,
				styles.header
			)
		

		return <CommandRoot
			component={this}
      id="header"
      style={headerStyle}>
			
			<WindowControls />
			
			<div style={FlexScale}/>
			
			<RainbowIndicator
				style={styles.logo}
			  eHidden
			  spinnerStyle={styles.logo.spinner}/>
			
			<CommandMenuRoot />
		</CommandRoot>
	}
}


