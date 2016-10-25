// Imports
import * as React from 'react'
import { connect } from 'react-redux'
import {List} from 'immutable'
import { PureRender } from "./PureRender"

import { createStructuredSelector, createSelector } from 'reselect'
import { ThemedStyles } from "epic-styles"
import { User } from "epic-models"

import { Avatar } from "epic-ui-components"

import { Select, ISelectItem } from "./Select"
import { enabledAssigneesSelector } from "epic-typedux"
import { shallowEquals } from  "epic-global"
import filterProps from 'react-valid-props'

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: [ FlexColumn, FlexAuto, {} ],
	
	avatar: [FlexRow, makeFlexAlign('center', 'flex-start'), {
		height: rem(3),
		
		label: {
			fontWeight: 500,
		},
		image: {
			height: rem(2.2),
			width: rem(2.2),
		}
		
	}]
})


/**
 * IMilestoneSelectProps
 */
export interface IAssigneeSelectProps {
	className?:string
	theme?:any
	styles?:any
	style?:any
	onKeyDown?:(event:React.KeyboardEvent<any>) => any
	labelStyle?:any
	avatarStyle?:any
	avatarLabelStyle?:any
	avatarImageStyle?:any
	
	underlineShow?:boolean
	
	assignees?:List<User>
	assignee:User
	onSelect: (assignee:User) => any
	repoId:number
}

/**
 * IMilestoneSelectState
 */
export interface IAssigneeSelectState {
	items:ISelectItem[]
}

/**
 * MilestoneSelect
 *
 * @class MilestoneSelect
 * @constructor
 **/

@connect(createStructuredSelector({
	assignees: enabledAssigneesSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class AssigneeSelect extends React.Component<IAssigneeSelectProps,IAssigneeSelectState> {
	
	static defaultProps = {
		underlineShow: false
	}
	
	/**
	 * Create Label
	 *
	 * @param assignee
	 * @returns {any}
	 */
	private makeItemNode = (assignee:User) => {
		const
			{styles,avatarStyle,avatarLabelStyle,avatarImageStyle} = this.props
		
		return <Avatar user={assignee}
		               labelPlacement='after'
		               style={makeStyle(styles.avatar,avatarStyle)}
		               avatarStyle={makeStyle(styles.avatar.image,avatarImageStyle)}
		               labelStyle={makeStyle(styles.avatar.label,avatarLabelStyle)}
		/>
		
	}
	
	/**
	 * Create menu items
	 *
	 * @param assignees
	 * @returns {any[]}
	 */
	makeItems(assignees:List<User>) {
		
		const
			{
				styles
			} = this.props,
			
			items = [{
				key: 'empty-assignee',
				value: '',
				node: this.makeItemNode({id:-1,login: 'unassigned'} as any)
			}] as ISelectItem[]
		
		
		
		
		return items.concat(assignees.map(assignee => ({
			key: assignee.url,
			value: assignee.id,
			node: this.makeItemNode(assignee),
			data: assignee
		})).toArray())
	}
	
	/**
	 * Create items and required elements
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		this.setState({
			items: this.makeItems(props
				.assignees
				.filter(it => it.repoIds.includes(props.repoId)) as List<User>)
			
		})
	}
	
	/**
	 * On change, notify
	 *
	 * @param item
	 */
	private onSelect = (item:ISelectItem) => {
		this.props.onSelect(item && item.data as User)
	}
	
	/**
	 * On mount always create items
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props - update items if required
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:IAssigneeSelectProps, nextContext:any):void {
		if (!shallowEquals(this.props,nextProps,'assignees','assignee','repoId'))
			this.updateState(nextProps)
	}
	
	/**
	 * Render the select
	 *
	 * @returns {any}
	 */
	render() {
		const
			{underlineShow,labelStyle, theme, styles,assignee } = this.props,
			{items} = this.state
		
		
		//labelStyle={styles.form.assignee.item.label}
		return <Select
			{...filterProps(this.props)}
			underlineShow={underlineShow}
			labelStyle={makeStyle({},labelStyle)}
			iconStyle={{top:8,right:-14}}
			itemStyle={makeStyle(FlexRow,FillWidth,{alignItems: 'flex-start',paddingLeft: 0,height:rem(4)})}
			value={assignee ? assignee.id : ''}
			items={items}
			onSelect={this.onSelect}
		>
		
		</Select>
	}
	
}