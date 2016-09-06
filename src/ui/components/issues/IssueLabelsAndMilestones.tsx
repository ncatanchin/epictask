/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import {Label} from 'shared/models/Label'
import {Themed, ThemedNoRadium} from 'shared/themes/ThemeManager'
import {Milestone} from 'shared/models/Milestone'
import {PureRender} from 'ui/components/common'
import LabelChip from 'ui/components/common/LabelChip'
const tinycolor = require('tinycolor2')


// Constants
const log = getLogger(__filename)


const baseStyles = createStyles({
	root: makeStyle(FlexRow, FlexAuto, {
		// overflowX: 'auto',
		// overflowY: 'visible'
	})
})



export type TOnLabelOrMilestoneCallback = (item:Label|Milestone,index:number) => void

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
	onMilestoneClick?:TOnLabelOrMilestoneCallback
	onLabelClick?:TOnLabelOrMilestoneCallback
	onRemove?:TOnLabelOrMilestoneCallback
	afterAllNode?:React.ReactNode
}

/**
 * IssueLabels
 *
 * @class IssueLabels
 * @constructor
 **/

@ThemedNoRadium
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
				onMilestoneClick,
				onLabelClick,
				labels
			} = this.props,
			{palette} = theme,
			{styles} = this.state



		return _.nilFilter(milestones || []).map((milestone:Milestone,index:number) =>
			<LabelChip key={milestone.id}
			               label={milestone}
			               showIcon={true}
			               showRemove={!!onRemove}
			               onClick={(event) => (onMilestoneClick && onMilestoneClick(milestone,index))}
			               onRemove={!!onRemove && ((milestone) => onRemove(milestone,index))}
			               labelStyle={labelStyle}
			/>
		).concat(_.nilFilter(labels || []).map((label:Label,index:number) =>
			<LabelChip  key={label.url}
			            label={label}
			            showRemove={!!onRemove}
			            showIcon={true}
			            onClick={(event) => (onLabelClick && onLabelClick(label,index))}
			            onRemove={!!onRemove && ((label) => onRemove(label,index))}
			            labelStyle={labelStyle}
            />
		) as any)
	}

	render() {
		return <div style={makeStyle(this.state.styles.root,this.props.style)}>
			{(this.props.labels || this.props.milestones) && this.renderLabels()}{this.props.afterAllNode}
		</div>
	}


}