/**
 * Created by jglanz on 6/13/16.
 */
// Imports
import { Label, Milestone } from "epic-models"
import { ThemedStylesNoRadium } from "epic-styles"
import { LabelChip } from "./LabelChip"
import { shallowEquals } from "epic-global"


// Constants
const
	log = getLogger(__filename),
	tinycolor = require('tinycolor2')


const baseStyles = (topStyles, theme, palette) => ({
	root: makeStyle(FlexRow, FlexAuto, {
		// overflowX: 'auto',
		// overflowY: 'visible'
	})
})


export type TOnLabelOrMilestoneCallback = (item:Label|Milestone, index:number) => void

/**
 * IIssueLabelsProps
 */
export interface IIssueLabelsAndMilestonesProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	milestones?:Milestone[]
	labels?:Label[]
	labelStyle?:any
	iconStyle?:any
	textStyle?:any
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

@ThemedStylesNoRadium(baseStyles, 'labels')

export class IssueLabelsAndMilestones extends React.Component<IIssueLabelsAndMilestonesProps,void> {
	
	
	shouldComponentUpdate(nextProps:IIssueLabelsAndMilestonesProps, nextState:void, nextContext:any):boolean {
		return !shallowEquals(this.props, nextProps, 'labels', 'milestones', 'showIcon')
	}

// updateState = (props = this.props) => {
	// 	const {theme} = props,
	// 		styles = mergeStyles(baseStyles, theme.labels)
	//
	// 	this.setState({styles})
	//
	// }
	//
	// componentWillMount = this.updateState
	// componentWillReceiveProps = this.updateState
	
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
				labels,
				iconStyle,
				textStyle,
				styles
			} = this.props,
			{ palette } = theme
		
		
		return _.nilFilter(milestones || []).map((milestone:Milestone, index:number) =>
			<LabelChip key={milestone.id}
			           label={milestone}
			           showIcon={showIcon}
			           iconStyle={iconStyle}
			           textStyle={textStyle}
			           showRemove={!!onRemove}
			           onClick={(event) => (onMilestoneClick && onMilestoneClick(milestone,index))}
			           onRemove={!!onRemove && ((milestone) => onRemove(milestone,index))}
			           labelStyle={labelStyle}
			/>
		).concat(_.nilFilter(labels || []).map((label:Label, index:number) =>
			<LabelChip key={label.id}
			           label={label}
			           showRemove={!!onRemove}
			           showIcon={showIcon}
			           textStyle={textStyle}
			           iconStyle={iconStyle}
			           onClick={(event) => (onLabelClick && onLabelClick(label,index))}
			           onRemove={!!onRemove && ((label) => onRemove(label,index))}
			           labelStyle={labelStyle}
			/>
		) as any)
	}
	
	render() {
		const
			hasValues = this.props.labels || this.props.milestones
		
		return <div style={makeStyle(this.props.styles.root,this.props.style)}>
			{ hasValues && this.renderLabels() }
			{
				this.props.afterAllNode
			}
		</div>
	}
	
	
}