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
import { ContextMenu, isEmpty, stopEvent } from "epic-global"
import { getValue } from "typeguard"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.FlexAuto, Styles.makePaddingRem(0,1), {
		maxWidth: '40vw',
		width: rem(30)
	} ]
}


/**
 * IIssueListsProps
 */
export interface IIssueListsProps extends IThemedAttributes {
	viewController?:IssuesPanelController
	listConfig?:IssueListConfig
	listConfigs?:List<IssueListConfig>
	listConfigId?:string
}

/**
 * IIssueListsState
 */
export interface IIssueListsState {
	editing?:boolean
	newName?:string
}

/**
 * IssueLists
 *
 * @class IssueLists
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
export class IssueLists extends React.Component<IIssueListsProps,IIssueListsState> {
	
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
				.addLabel(`Choose a list config...`)
				.addSeparator()
				
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
		
		return <div style={styles}>
			{editing &&
			<TextField
				autoFocus={true}
				styles={styles.nameField}
				placeholder="(untitled)"
				value={newName}
				onBlur={this.onTextBlur}
				onChange={this.onTextChange}
				onKeyDown={this.onTextKeyDown}
			/>}
			
			{!editing && <div style={[styles.label]} onClick={this.onTextClick}>
				{listConfig.name || 'Untitled List'}
			</div>}
			<Icon
				onClick={this.showListConfigs}
				style={[Styles.CursorPointer]}
			  iconName="arrow_drop_down"
			/>
		</div>
	}
	
}