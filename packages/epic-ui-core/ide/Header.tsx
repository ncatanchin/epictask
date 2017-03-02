import * as React from "react"
import { SearchField } from "epic-ui-components/search"
import { makeAbsolute, makeHeightConstraint, ThemedStyles, IThemedAttributes } from "epic-styles"

import {
	getCommandManager,
	ContainerNames
} from "epic-command-manager"
import { CommandMenuRoot } from "epic-ui-components"
import { WindowControls, PureRender } from "epic-ui-components/common"
import { AvailableNotificationIcon } from "epic-ui-core/notifications"

const
	log = getLogger(__filename)


const baseStyles = (topStyles, theme, palette) => {
	
	const
		{ primary, accent, text, secondary, background } = palette
	
	return [
		Styles.makeTransition([ 'height', 'max-height', 'min-height', 'opacity' ]),
		makeHeightConstraint(theme.navBarHeight),
		Styles.FlexRow,
		Styles.FillWidth,
		Styles.FlexAuto,
		Styles.PositionRelative,
		Styles.makePaddingRem(0, 0, 0, Env.isMac ? 10 : 0), {
			
			flexDirection: Env.isMac ? 'row' : 'row-reverse',
		
			WebkitUserSelect: 'none',
			WebkitAppRegion: 'drag',
			//border: 0,
			opacity: 1,
			height: theme.navBarHeight,
			
			
			
			hidden: [ makeHeightConstraint('0px'), Styles.makePaddingRem(0), {
				opacity: 0
			} ],
			
			
			
			controls: makeStyle(makeAbsolute(), {
				WebkitAppRegion: 'no-drag',
				opacity: 1,
				border: '0.2rem solid transparent',
				padding: 0
			}),
			
			controlButton: makeStyle(Styles.makeTransition(), Styles.FlexRowCenter, {
				display: 'inline-flex',
				border: '0.2rem solid transparent'
			}),
			
			controlButtonBefore: makeStyle(Styles.makeTransition()),
			
			logo: [
				Styles.makeTransition([ 'opacity' ]),
				{
					transform: 'scale(0.7)',
					spinner: [ {
						animationDuration: '5s'
					} ]
				}
			]
		} ]
	
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
@ThemedStyles(baseStyles, 'header')
@PureRender
export default class Header extends React.Component<IHeaderProps,IHeaderState> {
	
	
	constructor(props, context) {
		super(props, context)
	}
	
	get searchField():SearchField {
		const panel = _.get(this, 'state.searchField') as any
		return panel && panel.getWrappedInstance ? panel.getWrappedInstance() : panel
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
		this.setState({ searchField })
	}
	
	setHotKeysRef = (hotKeys) => {
		this.setState({ hotKeys })
	}
	
	/**
	 * On escape sequence close the header unless expanded
	 */
	onEscape = () => {
		
		log.info(`Header on escape`)
		
		getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
		
	}
	
	
	/**
	 * onBlur - exiting find
	 *
	 * @param event
	 */
	
	onBlur = (event) => {
		this.setState({
			focused: false
		})
	}
	
	/**
	 * On focus - usually for find
	 *
	 * @param event
	 */
	onFocus = (event) => {
		this.setState({ resultsHidden: false, focused: true })
	}
	
	keyHandlers = {}
	
	
	/**
	 * on mount clear the state
	 */
	componentWillMount = () => {
		!Env.isMac && require('electron').remote.getCurrentWindow().setTitle('epictask')
		
		!this.state && this.setState({})
	}
	
	
	/**
	 * Render component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ theme, styles, style } = this.props
		
		
		const
			headerStyle = makeStyle(
				styles,
				!Env.isMac && styles.win32,
				style
			)
		
		
		return <div
			id="header"
			style={headerStyle}>
			
			{/* OLD WINDOW CONTROLS
			{!Env.isMac && <WindowControls />}
			*/}
			
			{Env.isMac && <div style={styles.title}>epictask</div>}
			
			<div style={Styles.FlexScale}/>
			
			<AvailableNotificationIcon />
			<CommandMenuRoot />
		</div>
	}
}


