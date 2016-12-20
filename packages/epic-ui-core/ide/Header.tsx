import * as React from "react"
import { SearchField } from "epic-ui-components/search"
import { makeAbsolute, makeHeightConstraint, ThemedStyles, IThemedAttributes } from "epic-styles"

import {
	getCommandManager,
	ContainerNames
} from "epic-command-manager"
import { CommandMenuRoot } from "epic-ui-components"
import { WindowControls, PureRender } from "epic-ui-components/common"

const
	log = getLogger(__filename)


const baseStyles = (topStyles, theme, palette) => {
	
	const
		{ primary, accent, text, secondary, background } = palette
	
	return [
		Styles.makeTransition([ 'height', 'max-height', 'min-height', 'opacity' ]),
		makeHeightConstraint('50px'),
		Styles.FlexRow,
		Styles.FillWidth,
		Styles.FlexAuto,
		Styles.PositionRelative,
		Styles.makePaddingRem(0, 0, 0, 10), {
			
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
	componentWillMount = () => !this.state && this.setState({})
	
	
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
				style
			)
		
		
		return <div
			id="header"
			style={headerStyle}>
			
			{!Env.isMac && <WindowControls />}
			
			<div style={styles.title}>epictask</div>
			<div style={FlexScale}/>
			
			{/*<RainbowIndicator*/}
			{/*style={styles.logo}*/}
			{/*eHidden*/}
			{/*spinnerStyle={styles.logo.spinner}/>*/}
			
			<CommandMenuRoot />
		</div>
	}
}


