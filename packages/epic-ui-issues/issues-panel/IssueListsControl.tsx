// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { ThemedStyles, IThemedAttributes } from 'epic-styles'
import {IssuesPanelController,getIssuesPanelSelector} from "./IssuesPanelController"
import IssuesPanelState from "./IssuesPanelState"
import { IssueListConfig } from "./models/IssueListConfig"
import { SelectField, TextField } from "epic-ui-components/common"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { ContextMenu, isEmpty } from "epic-global"
import { getValue } from "typeguard"
import { makeHeightConstraint, colorLighten } from "epic-styles/styles"
import { stopEvent } from "epic-util"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.FlexAuto, Styles.makePaddingRem(0,1), {
		backgroundColor: primary.hue2,
		maxWidth: '40vw',
		width: rem(30),
		
		name: [Styles.FlexRowCenter,Styles.FlexScale,{
			backgroundColor: colorLighten(primary.hue2,5),
			
			border: `0.1rem solid ${theme.inactiveColor}`,
			
			text: [Styles.FlexScale,Styles.makePaddingRem(0.5,1),{
				fontSize: rem(1.4)
			}],
			
			action: [Styles.CursorPointer,Styles.FlexAuto,Styles.makePaddingRem(1),{
				fontSize: rem(1.7)
			}]
		}],
		
		
		
		nameField: [Styles.FlexScale,Styles.makePaddingRem(0.5,1),{
			backgroundColor: primary.hue2,
			color: text.primary,
			
			
			input: [Styles.FlexScale,Styles.makePaddingRem(0.2),{
				backgroundColor: primary.hue2,
				color: text.primary,
				border: 0,
				fontSize: rem(1.4),
				
				[Styles.CSSFocusState]: {
					boxShadow: 'none',
					backgroundColor: primary.hue2,
					color: text.primary,
					border: 0,
				}
			}]
			
		}]
		
		
		
	} ]
}


/**
 * IIssueListsControlProps
 */
export interface IIssueListsControlProps extends IThemedAttributes {
	viewController?:IssuesPanelController
	listConfig?:IssueListConfig
	listConfigs?:List<IssueListConfig>
	listConfigId?:string
}

/**
 * IIssueListsControlState
 */
export interface IIssueListsControlState {
	editing?:boolean
	newName?:string
}

/**
 * IssueListsControl
 *
 * @class IssueListsControl
 * @constructor
 **/

@connect(() => createStructuredSelector({
	listConfigId: getIssuesPanelSelector(selectors => selectors.listConfigIdSelector),
	listConfig: getIssuesPanelSelector(selectors => selectors.listConfigSelector),
	listConfigs: getIssuesPanelSelector(selectors => selectors.listConfigsSelector),
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class IssueListsControl extends React.Component<IIssueListsControlProps,IIssueListsControlState> {
	
	get viewController() {
		return this.props.viewController
	}
	
	get editing() {
		return getValue(() => this.state.editing,false)
	}
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			editing: false
		}
	}
	
	
	/**
	 * Save name editing
	 */
	private save = () => {
		const
			name = getValue(() => this.state.newName)
		
		if (isEmpty(name))
			return getNotificationCenter().notifyError(`Name can not be empty`)
		
		this.viewController.setListConfigName(name)
		this.cancel()
	}
	
	/**
	 * Cancel name editing
	 */
	private cancel = () => {
		this.setState({editing: false, newName: null})
	}
	
	/**
	 * Start editing the name if selected
	 *
	 * @param event
	 */
	private onTextClick = (event) => {
		const
			{listConfig} = this.props
		
		if (!this.editing) {
			this.setState({
				editing: true,
				newName: listConfig.name || 'Untitled List'
			})
		}
		
	}
	
	/**
	 * Update state on text change
	 *
	 * @param event
	 */
	private onTextChange = (event) => this.setState({
		newName: event.target.value
	})
	
	
	/**
	 * on text key down
	 *
	 * @param event
	 */
	private onTextKeyDown = (event) => {
		const
			isEnter = event.key === 'Enter',
			isEscape = event.key === 'Escape'
		
		if (isEnter || isEscape) {
			stopEvent(event)
			
			isEnter ? this.save() : this.cancel()
		}
	}
	
	/**
	 * On blur, save
	 *
	 * @param event
	 */
	private onTextBlur = (event) => {
		const
			{selected} = this.props
		
		if (selected && this.editing) {
			this.save()
		}
	}
	
	
	/**
	 * Show available list configs
	 */
	showListConfigs = () => {
		const
			{listConfigs,listConfig,viewController} = this.props,
			menu = ContextMenu.create()
				.addCommand(`New list`,() => viewController.newListConfig())
				//.addLabel(`Choose a list config...`)
		
		if (listConfig.saved)
			menu.addCommand(`Delete list`,() => viewController.deleteListConfig(listConfig.id))
				
		menu.addSeparator()
				
		if (listConfigs.size) {
			listConfigs.forEach(config =>
				menu.addCommand(config.name || '(untitled)',() => viewController.setListConfig(config.id)))
		} else {
			menu.addLabel(`You haven't saved any list configs yet`)
		}
		
		menu.popup()
		
	}
	
	render() {
		const
			{ listConfig,styles } = this.props,
			{editing,newName} = this.state
		
		if (!listConfig)
			return React.DOM.noscript()
		
		return <div style={styles}>
			{editing ?
			<TextField
				autoFocus={true}
				styles={styles.nameField}
				placeholder="(untitled)"
				value={newName}
				onBlur={this.onTextBlur}
				onChange={this.onTextChange}
				onKeyDown={this.onTextKeyDown}
			/> :
				<div style={[styles.name]}>
					<div style={[styles.name.text]} onClick={this.onTextClick}>
						{listConfig.name || 'Untitled List'}
					</div>
					<Icon
						onClick={this.showListConfigs}
						style={styles.name.action}
						iconName="settings"
					/>
				</div>
			
			}
			
		</div>
	}
	
}