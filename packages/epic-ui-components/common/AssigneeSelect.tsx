// Imports
import { connect } from "react-redux"
import { List } from "immutable"
import { createStructuredSelector } from "reselect"
import { shallowEquals } from "epic-global"
import filterProps from "react-valid-props"
import { getValue } from "typeguard"
import { assigneesSelector } from "epic-typedux"

import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { User } from "epic-models"
import { Avatar } from "./Avatar"
import { PureRender } from "./PureRender"
import { SelectField } from "./SelectField"

// Constants
const
	log = getLogger(__filename)

function baseStyles(topStyles, theme, palette) {
	return []
}


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
			value = assignee && items
					.find(item => item && item.key === getValue(() => assignee.id))
		
		
		//labelStyle={styles.form.assignee.item.label}
		return <SelectField
			{...filterProps(this.props)}
			value={value}
			items={items.filter(it => it && (!value || it.key !== value.key))}
			onItemSelected={this.onItemSelected}
		/>
	}
	
}