import * as React from 'react'
import {SearchPanel} from 'ui/components/search'
import {makeAbsolute} from 'shared/themes/styles/CommonStyles'
import {TextField} from 'material-ui/TextField'
import { PureRender, Icon } from 'ui/components/common'
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { getCommandManager } from "shared/commands/CommandManager"
import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import { makeHeightConstraint } from "shared/themes/styles"
import { WindowControls } from "ui/components/common/WindowControls"
import { Logo } from "ui/components/common/Logo"
import { CommandMenuRoot } from "shared/commands/CommandMenuRoot"

export const ImageLogoFile = require('assets/images/epictask-logo-rainbow.png')

const log = getLogger(__filename)


export enum HeaderVisibility {
	Hidden,
	Normal
}

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
	className?:string
	visibility:HeaderVisibility
	style?:any
}

export interface IHeaderState {
	searchPanel?:SearchPanel
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
export class Header extends React.Component<IHeaderProps,IHeaderState> implements ICommandComponent {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder.make()
	
	readonly commandComponentId:string = 'Header'
	
	constructor(props,context) {
		super(props,context)
	}

	get searchPanel():SearchPanel {
		const panel = _.get(this,'state.searchPanel') as any
		return panel && panel.getWrappedInstance ? panel.getWrappedInstance() : panel
	}

	get textField():TextField {
		return _.get(this,'searchPanel.textField') as any
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

	setSearchPanelRef = (searchPanel) => {
		this.setState({searchPanel})
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
		
		// const {searchPanel} = this
		//
		// if (searchPanel) {
		// 	const textField:any = searchPanel.textField
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
			{theme,visibility, styles,style} = this.props,
		
			themeHeight = theme.header.style.height

			
		
		
		const
			headerStyle = makeStyle(
				theme.header.style,
				style,
				styles.header,
				visibility === HeaderVisibility.Hidden &&
					styles.header.hidden
			)
		

		return <CommandRoot
			component={this}
      id="header"
      style={headerStyle}>
			
			<WindowControls />
			
			<div style={FlexScale}/>
			
			<Logo style={styles.logo}
			      eHidden
			      spinnerStyle={styles.logo.spinner}/>
			
			<CommandMenuRoot />
		</CommandRoot>
	}
}


