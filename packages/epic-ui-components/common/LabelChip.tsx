/**
 * Created by jglanz on 8/9/16.
 */
// Imports
import * as moment from "moment"
import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { ThemedStyles } from "epic-styles"
import { Label, Milestone } from "epic-models"
import { getValue } from "epic-global"

const tinycolor = require('tinycolor2')

// Constants
//noinspection JSUnusedLocalSymbols
const
	log = getLogger(__filename),
	accessoryDim = rem(2.4),
	accessoryDimHalf = rem(1.2),
	accessoryTransition = makeTransition([
		'background-color',
		'font-weight',
		'font-size',
		'border-radius',
		'opacity',
		'width',
		'padding',
		'background-color',
		'color'
	])

export const baseStyles = (topStyles,theme,palette) => ({
	label: [ makeTransition('width'), PositionRelative, FlexAuto, FlexRowCenter, {
		display: 'flex',
		borderRadius: accessoryDimHalf,
		height: accessoryDim,
		//borderRadius: '0.3rem',
		marginTop: 0,
		marginRight: rem(1),
		marginBottom: 0,
		marginLeft: 0,
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)',
		
		':hover': {},
		
		collapsed: [ {
			width: rem(2.4)
		} ]
	} ],
	
	
	// Accessories
	accessory: [
		accessoryTransition,
		FlexAuto, FlexRowCenter,
		makePaddingRem(0, 0, 0, 0), {
			height: accessoryDim,
			width: accessoryDim,
			borderRadius: accessoryDimHalf,
			
			// icon decoration
			icon: [ accessoryTransition, FlexColumnCenter, makePaddingRem(0, 0, 0, 0), {
				height: accessoryDim,
				width: accessoryDim,
				fontSize: accessoryDimHalf
			} ],
			
			hover: [ {
				borderRadius: 0,
				fontWeight: 700,
				fontSize: rem(1.5),
				icon: [ {} ]
			} ],
			
			// REMOVE CONTROL
			remove: [ OverflowHidden, {
				//hovering && {backgroundColor: palette.errorColor,color:palette.textColor}
				fontSize: themeFontSize(1),
				cursor: 'pointer',
				
				// ICON REMOVE
				icon: [ {} ],
				
				// HOVER REMOVE
				hover: [ {
					icon: [ {} ]
				} ]
			} ]
			
			
		} ],
	
	text: [ makePaddingRem(0, 1.2, 0, 1.2), {
		textAlign: 'baseline',
		withLeftIcon: [ makePaddingRem(0, 1.2, 0, 0.6) ]
	} ]
	
})


function isLabel(o:any):o is Label {
	return !o.id
}

export type TLabelCallback = (label:Label|Milestone) => void

/**
 * ILabelChipProps
 */
export interface ILabelChipProps {
	theme?:any
	styles?:any
	onClick?:React.MouseEventHandler<any>
	label:Label|Milestone
	labelStyle?:any
	textStyle?:any
	showIcon?:boolean
	showDueOn?:boolean
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
@ThemedStyles(baseStyles, 'labelChip')
@PureRender
export class LabelChip extends React.Component<ILabelChipProps,any> {
	
	
	private updateState(props) {
		this.setState({ hovering: Radium.getState(this.state, 'label', ':hover') })
	}
	
	/**
	 * On mount create initial state
	 */
	componentWillMount = () => this.updateState(this.props)
	
	/**
	 * Update state when newProps are received
	 *
	 * @param newProps
	 */
	componentWillReceiveProps = (newProps) => this.updateState(newProps)
	
	
	formatDueOn(milestone:Milestone) {
		const
			due = getValue(() => milestone.due_on)
		
		return !due ? '' : `  (due on ${moment(due).format('MM-DD-YY')})`
	}
	
	labelColorStyle(label:Label) {
		const
			{ theme } = this.props,
			backgroundColor = '#' + label.color,
			color = tinycolor.mostReadable(backgroundColor, [
				theme.textColor,
				tinycolor(theme.alternateTextColor).lighten(20)
			]).toRgbString()
		
		return {
			cursor: 'pointer',
			backgroundColor,
			color,
			accessory: {
				backgroundColor: tinycolor(backgroundColor).darken(10).toRgbString()
			}
		}
		
	}
	
	render() {
		const
			{
				theme,
				styles,
				showIcon,
				onClick,
				onRemove,
				showRemove,
				showDueOn,
				label,
				labelStyle,
				textStyle
			} = this.props,
			{ palette } = theme,
			isMilestone = !isLabel(label)
		
		
		const
			makeLabelStyle = (label:Label) => {
				return makeStyle(styles.label, this.labelColorStyle(label), labelStyle)
			},
			makeMilestoneStyle = (milestone:Milestone) => {
				return makeStyle(styles.label, {
					backgroundColor: 'black',
					color: 'white'
				}, labelStyle)
			}
		
		
		// Is the label in hover state
		const
			finalLabelStyle = (!isMilestone) ?
				makeLabelStyle(label as Label) :
				makeMilestoneStyle(label as Milestone),
			
			hovering = Radium.getState(this.state, 'label', ':hover')
		
		
		return <div ref='label' className="labelChip" style={[finalLabelStyle]} onClick={onClick}>
			{onRemove ?
				<div style={[
					styles.accessory,
					finalLabelStyle.accessory,
					hovering && styles.accessory.hover,
					hovering && styles.accessory.remove.hover
					]} className="removeControl">
					<Icon
						style={makeStyle(
								styles.accessory.icon,
								styles.accessory.remove.icon,
								hovering && styles.accessory.remove.hover.icon
								
							)}
						onClick={(event) => (onRemove(label), event.stopPropagation(),event.preventDefault())}>
						clear
					</Icon>
				</div> :
				showIcon ?
					<div style={[
						styles.accessory,
						finalLabelStyle.accessory
					]}>
						<Icon style={styles.accessory.icon}
						      iconSet='octicon'
						      iconName={isMilestone ? 'milestone' : 'tag'}/>
					</div> :
					React.DOM.noscript()
			}
			
			<div style={[styles.text, (showIcon || onRemove) && styles.text.withLeftIcon,textStyle]}>
				{isLabel(label) ? label.name : `${label.title}${!showDueOn ? '' : this.formatDueOn(label)}`}
			</div>
		
		
		</div>
	}
	
}

export default LabelChip