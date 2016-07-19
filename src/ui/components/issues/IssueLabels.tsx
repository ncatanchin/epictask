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
const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)
const baseStyles = createStyles({
	root: makeStyle(FlexRow, FlexAuto, {}),
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


export type TOnLabelRemove = (label:Label,index:number) => void

/**
 * IIssueLabelsProps
 */
export interface IIssueLabelsProps extends React.DOMAttributes {
	theme?:any
	style?:any
	labels?:Label[]
	labelStyle?:any
	showIcon?:boolean
	onRemove?:TOnLabelRemove
}

/**
 * IssueLabels
 *
 * @class IssueLabels
 * @constructor
 **/

@Themed
export class IssueLabels extends React.Component<IIssueLabelsProps,any> {


	constructor(props = {}) {
		super(props)
	}

	updateState = (props = this.props) => {
		const {theme} = props,
			styles = mergeStyles(baseStyles, theme.labels)

		this.setState({styles})

	}

	componentWillMount = this.updateState
	componentWillReceiveProps = this.updateState

	renderLabels(props) {

		const {theme,onRemove,showIcon} = this.props,
			{styles} = this.state

		return _.nilFilter(props.labels).map((label:Label,index:number) => {
			const
				p = theme.palette,
				backgroundColor = '#' + label.color,
				labelStyle = makeStyle(styles.label, props.labelStyle, {
					backgroundColor,
					color: tinycolor.mostReadable(backgroundColor,[
						p.text.secondary,
						p.alternateText.secondary
					])
				})
			return <div key={label.url} style={labelStyle}>
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

		})
	}

	render() {
		return <div style={makeStyle(this.state.styles.root,this.props.style)}>
			{this.props.labels && this.renderLabels(this.props)}
		</div>
	}


}