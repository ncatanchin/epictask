/**
 * Created by jglanz on 8/9/16.
 */

// Imports
import * as React from 'react'
import {PureRender} from 'ui/components/common'
import {Milestone} from 'models/Milestone'


// Constants
const log = getLogger(__filename)



export type TMilestoneCallback = (milestone:Milestone) => void

/**
 * IMilestoneChipProps
 */
export interface IMilestoneChipProps extends React.HTMLAttributes {
	milestone:Milestone
	milestoneStyle?:any
	showIcon?:boolean
	showRemove?:boolean
	onRemove?:TMilestoneCallback
}


/**
 * MilestoneChip
 *
 * @class MilestoneChip
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@PureRender
export default class MilestoneChip extends React.Component<IMilestoneChipProps,any> {

	static defaultProps = {
		showIcon: true,
		showRemove: false
	}

	render() {
		const {
			theme,
			styles,
			milestone,
			onRemove,
			showRemove,
			milestoneStyle,
			showIcon
		} = this.props

		return <div></div>
		// return <LabelChip labelStyle={finalLabelStyle}>
		// 	{showIcon &&
		// 		<Icon style={styles.icon}
		// 		      iconSet='octicon'
		// 		      iconName='milestone'/>
		// 	}
		//
		// 	<div style={styles.text}>{milestone.title}</div>
		//
		// 	{onRemove &&
		// 		<Icon
		// 			style={styles.remove}
		// 			onClick={() => onRemove(milestone)}
		// 			iconSet='fa'
		// 			iconName='times'/>}
		// </div>
	}

}