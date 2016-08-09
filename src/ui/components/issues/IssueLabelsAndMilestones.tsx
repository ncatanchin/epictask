/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Models from 'shared/models'
import {Label} from 'shared/models/Label'
import * as Constants from 'shared/Constants'
import {Themed} from 'shared/themes/ThemeManager'
import {Icon} from 'ui/components/common/Icon'
import {Milestone} from 'shared/models/Milestone'
import {PureRender} from 'components/common'
import MilestoneChip from 'epictask/ui/components/common/MilestoneChip'
import LabelChip from 'epictask/ui/components/common/LabelChip'
const tinycolor = require('tinycolor2')


// Constants
const log = getLogger(__filename)


const baseStyles = createStyles({
	root: makeStyle(FlexRow, FlexAuto, {
		overflow: 'auto'
	})
})



export type TOnLabelOrMilestoneRemove = (item:Label|Milestone,index:number) => void

/**
 * IIssueLabelsProps
 */
export interface IIssueLabelsAndMilestonesProps extends React.DOMAttributes {
	theme?:any
	style?:any
	milestones?:Milestone[]
	labels?:Label[]
	labelStyle?:any
	showIcon?:boolean
	onRemove?:TOnLabelOrMilestoneRemove
}

/**
 * IssueLabels
 *
 * @class IssueLabels
 * @constructor
 **/

@Themed
@PureRender
export class IssueLabelsAndMilestones extends React.Component<IIssueLabelsAndMilestonesProps,any> {


	updateState = (props = this.props) => {
		const {theme} = props,
			styles = mergeStyles(baseStyles, theme.labels)

		this.setState({styles})

	}

	componentWillMount = this.updateState
	componentWillReceiveProps = this.updateState

	renderLabels() {

		const
			{
				theme,
				onRemove,
				showIcon,
				milestones,
				labelStyle,
				labels

			} = this.props,
			{palette} = theme,
			{styles} = this.state



		return _.nilFilter(milestones || []).map((milestone:Milestone,index:number) =>
			<MilestoneChip key={milestone.id}
			               milestone={milestone}
			               showIcon={true}
			               showRemove={true}
			               onRemove={(milestone) => onRemove(milestone,index)}
			               milestoneStyle={labelStyle}
			/>
		).concat(_.nilFilter(labels || []).map((label:Label,index:number) =>
			<LabelChip  key={label.url}
			            label={label}
			            showRemove={true}
			            showIcon={true}
			            onRemove={(label) => onRemove(label,index)}
			            labelStyle={labelStyle}
            />
		) as any)
	}

	render() {
		return <div style={makeStyle(this.state.styles.root,this.props.style)}>
			{this.props.labels && this.renderLabels()}
		</div>
	}


}