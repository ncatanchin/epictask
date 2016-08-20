/**
 * Created by jglanz on 8/9/16.
 */

// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Label} from 'shared/models/Label'
import {Icon} from 'ui/components'
import {Milestone} from 'shared/models/Milestone'

const tinycolor = require('tinycolor2')

// Constants
//noinspection JSUnusedLocalSymbols
const log = getLogger(__filename)

export const baseStyles = createStyles({
	label: [PositionRelative,FlexRowCenter,{
		borderRadius: '0.3rem',
		marginTop: 0,
		marginRight: rem(1),
		marginBottom: 0,
		marginLeft: 0,
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)',
		':hover': {}
	}],


	// Accessories
	accessory: [FlexAuto,FlexRowCenter,{
		height: "100%",
		

		// icon decoration
		icon: [{
			padding: "0.6rem",
			fontSize: themeFontSize(1),
			lineHeight: 1
			
		}],

		right: [PositionAbsolute,{
			right: 0,
			top:0,
			bottom: 0
		}],

		left: [PositionAbsolute,{
			left: 0,
			top:0,
			bottom: 0
		}],
		

		// remove control
		remove: [makeTransition(['opacity','width','padding','background-color','color']), OverflowHidden,{
			fontSize: themeFontSize(1),
			padding: 0,
			cursor: 'pointer',
			lineHeight: 1,
			display: 'block',
			opacity: 0,
			width: 0,
			maxWidth: 0,

			hover: [{
				width: 'auto',
				maxWidth: 'none',
				opacity: 1,
				padding: '0.6rem'
			}]
		}]


	}],

	text: [makePaddingRem(0,0.8,0,8),FlexAuto,FlexRowCenter,{
		flexGrow: 1,
		height: '100%',
		textAlign: 'baseline',
		//justifyContent: '',
		
		withLeftIcon: [makePaddingRem(0,0.8,0,0)]
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
	onClick?:React.MouseEventHandler
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
@ThemedStyles(baseStyles,'labelChip')
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
				onClick,
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


		return <div ref='label' style={finalLabelStyle} onClick={onClick}>
			{showIcon &&
				<div style={styles.accessory}>
					<Icon style={styles.accessory.icon}
				      iconSet='octicon'
				      iconName={isMilestone ? 'milestone' : 'tag'}/>
			      </div>
			}

	        <div style={[styles.text, showIcon && styles.text.withLeftIcon]} >
		        <span>{isLabel(label) ? label.name : label.title}</span>
	        </div>


			{onRemove &&
				<div style={[styles.accessory,styles.accessory.left]} className="removeControl">
					<Icon
						style={[
							styles.accessory.remove,
							hovering && styles.accessory.remove.hover,
							hovering && {backgroundColor: palette.errorColor,color:palette.textColor}
						]}
						onClick={(event) => (onRemove(label), event.stopPropagation(),event.preventDefault())}
						iconSet='fa'
						iconName='times'/>
				</div>}
		</div>
	}

}