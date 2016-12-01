// Imports

import { connect } from 'react-redux'
import { List } from 'immutable'
import { Avatar, PureRender } from "../common"

import { createStructuredSelector } from 'reselect'
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { User } from "epic-models"


import { SelectField } from "./SelectField"
import { assigneesSelector } from "epic-typedux"
import { shallowEquals } from  "epic-global"
import filterProps from 'react-valid-props'
import { getValue } from "typeguard"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => ({
	// root: [ FlexColumn, FlexAuto, {} ],
	//
	// avatar: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
	// 	height: rem(3),
	//
	// 	label: {
	// 		fontWeight: 500,
	// 	},
	// 	image: {
	// 		height: rem(2.2),
	// 		width: rem(2.2),
	// 	}
	//
	// } ]
})


/**
 * IMilestoneSelectProps
 */
export interface IAssigneeSelectProps extends IThemedAttributes {
	
	labelStyle?: any
	avatarStyle?: any
	avatarLabelStyle?: any
	avatarImageStyle?: any
	
	
	assignees?: List<User>
	
	assignee: User
	
	onItemSelected: (assignee: User) => any
	repoId: number
}

/**
 * IMilestoneSelectState
 */
export interface IAssigneeSelectState {
	items:ISelectFieldItem[]
}

/**
 * MilestoneSelect
 *
 * @class MilestoneSelect
 * @constructor
 **/

@connect(createStructuredSelector({
	assignees: assigneesSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'dialog')
@PureRender
export class AssigneeSelect extends React.Component<IAssigneeSelectProps,IAssigneeSelectState> {
	
	static UnassignedItem = {
		key: null,
		value: null,
		content: <Avatar
			user={User.UnknownUser}
			labelPlacement='after'
		/>
	}
	
	static defaultProps = {}
	
	/**
	 * Create menu items
	 *
	 * @param props
	 * @returns {any[]}
	 */
	makeItems(props = this.props) {
		
		const
			{
				styles,
				repoId,
				assignees
			} = this.props,
			
			// MAP ITEMS
			items = assignees
				.filter(assignee => !repoId ||
				getValue(() => assignee.repoIds.includes(repoId), false))
				.map(assignee => ({
					key: assignee.id,
					value: assignee,
					content: <Avatar
						user={assignee}
						labelPlacement='after'
					/>,
					contentText: assignee.login + '||' + assignee.name + '||' + assignee.email
				})).toArray()
		
		
		return [ AssigneeSelect.UnassignedItem, ...items ]
	}
	
	/**
	 * Create items and required elements
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		this.setState({
			items: this.makeItems(props)
		})
	}
	
	/**
	 * On change, notify
	 *
	 * @param item
	 */
	private onItemSelected = (item: ISelectFieldItem) => {
		this.props.onItemSelected(item && item.value as User)
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
	componentWillReceiveProps(nextProps: IAssigneeSelectProps, nextContext: any): void {
		if (!shallowEquals(this.props, nextProps, 'assignees', 'assignee', 'repoId'))
			this.updateState(nextProps)
	}
	
	/**
	 * Render the select
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ labelStyle, theme, styles, assignees, assignee } = this.props,
			{items} = this.state,
			
			// GET SELECTED ITEM AS VALUE
			value = assignee && items.find(item =>
				item.key === getValue(() => assignee.id))
		
		
		//labelStyle={styles.form.assignee.item.label}
		return <SelectField
			{...filterProps(this.props)}
			value={value}
			items={items.filter(it => !value || it.key !== value.key)}
			onItemSelected={this.onItemSelected}
		/>
	}
	
}