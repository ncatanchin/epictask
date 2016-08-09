/**
 * Created by jglanz on 8/9/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Milestone} from 'models/Milestone'
import {baseStyles} from './LabelChip'
import {Icon} from 'epictask/ui/components'

// Constants
const log = getLogger(__filename)



export type TMilestoneCallback = (milestone:Milestone) => void

/**
 * IMilestoneChipProps
 */
export interface IMilestoneChipProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
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
@ThemedStyles(baseStyles,'labels')
@Radium
@PureRender
export default class MilestoneChip extends React.Component<IMilestoneChipProps,void> {

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

		const
			finalLabelStyle = makeStyle(styles.label,milestoneStyle, {
				backgroundColor: 'black',
				color: 'white'
			})

		return <div key={milestone.id} style={finalLabelStyle}>
			{showIcon &&
				<Icon style={styles.icon}
				      iconSet='octicon'
				      iconName='milestone'/>
			}

			<div style={styles.text}>{milestone.title}</div>

			{onRemove &&
				<Icon
					style={styles.remove}
					onClick={() => onRemove(milestone)}
					iconSet='fa'
					iconName='times'/>}
		</div>
	}

}