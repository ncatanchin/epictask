/**
 * Created by jglanz on 8/9/16.
 */

// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Issue, Label} from 'epictask/shared'
import {Icon} from 'epictask/ui/components'
import {Milestone} from 'models/Milestone'

const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)

export const baseStyles = createStyles({
	label: [FlexRowCenter,{
		padding: '0.6rem 1rem',
		borderRadius: '0.3rem',
		margin: '0 1rem 0 0',
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)',
		':hover': {}
	}],


	// Accessories
	accessory: [FlexAuto,FlexRowCenter,{
		height: 12,

		// icon decoration
		icon: [{
			fontSize: themeFontSize(1),
			padding: '0 0.5rem 0 0',
			lineHeight: 1
		}],


		// remove control
		remove: [makeTransition(['opacity','width','padding','color']), OverflowHidden,{
			fontSize: themeFontSize(1),
			padding: 0,
			cursor: 'pointer',
			lineHeight: 1,
			display: 'block',
			opacity: 0,
			width: 0,
			maxWidth: 0,

			hover: [{
				width: rem(1.2),
				maxWidth: rem(1.2),
				opacity: 1,
				padding: '0 0 0 0.5rem',

			}]
		}]


	}],

	text: [FlexAuto,FlexRowCenter,{
		padding: '0 0.5rem',
		height: 12,
		fontSize: themeFontSize(1.1),
		fontWeight: 700,
		lineHeight: 1
	}]

})


function isLabel(o:any):o is Label {
	return !o.id
}

export type TLabelCallback = (label:Label|Milestone) => void

/**
 * ILabelChipProps
 */
export interface ILabelChipProps {
	theme?: any
	styles?: any
	label:Label|Milestone
	labelStyle?:any
	showIcon?:boolean
	showRemove?:boolean
	onRemove?:TLabelCallback
}

/**
 * LabelChip
 *
 * @class LabelChip
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'labels')
@Radium
@PureRender
export default class LabelChip extends React.Component<ILabelChipProps,any> {

	constructor(props,context) {
		super(props,context)
	}


	updateState(props) {
		this.setState({hovering: Radium.getState(this.state,'label',':hover')})
	}

	componentWillMount = () => this.updateState(this.props)

	componentWillReceiveProps = (newProps) => this.updateState(newProps)

	render() {
		const
			{
				theme,
				styles,
				showIcon,
				onRemove,
				showRemove,
				label,
				labelStyle
			} = this.props,
			{palette} = theme,
			isMilestone = !isLabel(label)


		const makeLabelStyle = (label:Label) => {
			const
				backgroundColor = '#' + label.color

			return makeStyle(styles.label, {
				backgroundColor,
				color: tinycolor.mostReadable(backgroundColor,[
					palette.text.secondary,
					palette.alternateText.secondary
				])
			},labelStyle)
		}


		const makeMilestoneStyle = (milestone:Milestone) => {
			return makeStyle(styles.label, {
				backgroundColor: 'black',
				color: 'white'
			},labelStyle)
		}



		// Is the label in hover state
		const
			finalLabelStyle = (!isMilestone) ?
				makeLabelStyle(label as Label) :
				makeMilestoneStyle(label as Milestone),

			hovering = Radium.getState(this.state,'label',':hover')


		return <div ref='label' style={finalLabelStyle}>
			{showIcon &&
				<div style={styles.accessory}>
					<Icon style={styles.accessory.icon}
				      iconSet='octicon'
				      iconName={isMilestone ? 'milestone' : 'tag'}/>
			      </div>
			}

	        <div style={styles.text}>
		        <span>{isLabel(label) ? label.name : label.title}</span>
	        </div>


			{onRemove &&
				<div style={styles.accessory} className="removeControl">
					<Icon
						style={[
							styles.accessory.remove,
							hovering && styles.accessory.remove.hover,
							hovering && {color: palette.errorColor}
						]}
						onClick={() => onRemove(label)}
						iconSet='fa'
						iconName='times'/>
				</div>}
		</div>
	}

}