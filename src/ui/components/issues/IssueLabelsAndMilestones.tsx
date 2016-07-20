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
const tinycolor = require('tinycolor2')


// Constants
const log = getLogger(__filename)
const baseStyles = createStyles({
	root: makeStyle(FlexRow, FlexAuto, {
		overflow: 'auto'
	}),
	label: [FlexRowCenter,{
		padding: '0.6rem 1rem',
		borderRadius: '0.3rem',
		margin: '0 1rem 0 0',
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)'
	}],
	icon: [FlexAuto,{
		fontSize: themeFontSize(1),
		padding: '0 0.5rem 0 0'
	}],
	text: [FlexAuto,{
		fontSize: themeFontSize(1.1),
		fontWeight: 700,
		lineHeight: 1
	}],
	remove: [FlexAuto,{
		fontSize: themeFontSize(1),
		padding: '0 0 0 0.5rem',
		cursor: 'pointer'
	}]

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



		return _.nilFilter(milestones || []).map((milestone:Milestone,index:number) => {
			const
				finalLabelStyle = makeStyle(styles.label, labelStyle, {
					backgroundColor: 'black',
					color: 'white'
				})

			return <div key={milestone.id} style={finalLabelStyle}>
				{showIcon &&
				<Icon style={styles.icon}
				      iconSet='octicon'
				      iconName='milestone'/>}
				<div style={styles.text}>{milestone.title}</div>
				{onRemove &&
				<Icon
					style={styles.remove}
					onClick={() => onRemove(milestone,index)}
					iconSet='fa'
					iconName='times'/>}
			</div>

		}).concat(_.nilFilter(labels || []).map((label:Label,index:number) => {


			const

				backgroundColor = '#' + label.color,
				finalLabelStyle = makeStyle(styles.label, labelStyle, {
					backgroundColor,
					color: tinycolor.mostReadable(backgroundColor,[
						palette.text.secondary,
						palette.alternateText.secondary
					])
				})
			return <div key={label.url} style={finalLabelStyle}>
				{showIcon &&
					<Icon style={styles.icon}
					      iconSet='octicon'
					      iconName='tag'/>}
				<div style={styles.text}>{label.name}</div>
				{onRemove &&
					<Icon
						style={styles.remove}
						onClick={() => onRemove(label,index)}
						iconSet='fa'
						iconName='times'/>}
			</div>

		}) as any)
	}

	render() {
		return <div style={makeStyle(this.state.styles.root,this.props.style)}>
			{this.props.labels && this.renderLabels()}
		</div>
	}


}