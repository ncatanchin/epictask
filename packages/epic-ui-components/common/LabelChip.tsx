/**
 * Created by jglanz on 8/9/16.
 */
// Imports

import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { ThemedStyles } from "epic-styles"
import { Label, Milestone } from "epic-models"
import { getValue } from "epic-global"
import { isLabel } from "epic-models/Label"
import { makePaddingRem, FlexColumnCenter, FlexRowCenter, FlexAuto, isHovering } from "epic-styles/styles"

const
	tinycolor = require('tinycolor2'),
	Tooltip = require('react-tooltip')
	

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

export const baseStyles = (topStyles, theme, palette) => ({
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


export type TLabelCallback = (label:Label|Milestone) => void

export type TLabelChipMode = 'normal' | 'dot'

/**
 * ILabelChipProps
 */
export interface ILabelChipProps {
	theme?:any
	styles?:any
	onClick?:React.MouseEventHandler<any>
	mode?:TLabelChipMode
	label:Label|Milestone
	labelStyle?:any
	textStyle?:any
	iconStyle?:any
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

class BaseLabelChip extends React.Component<ILabelChipProps,any> {
	
	static defaultProps = {
		mode: 'normal'
	}
	
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
	
	/**
	 * Create label style
	 *
	 * @param styles
	 * @param labelStyle
	 * @param label
	 * @returns {any}
	 */
	makeLabelStyle = ({styles,labelStyle},label:Label) => {
		return makeStyle(styles.label, this.labelColorStyle(label), labelStyle)
	}
	
	
	/**
	 * Create milestone style
	 *
	 * @param styles
	 * @param labelStyle
	 * @param milestone
	 * @returns {any}
	 */
	makeMilestoneStyle = ({styles,labelStyle},milestone:Milestone) => {
		return makeStyle(styles.label, {
			backgroundColor: 'black',
			color: 'white'
		}, labelStyle)
	}
	
	render() {
		const
			{props} = this,
			{
				styles,
				showIcon,
				onClick,
				onRemove,
				mode,
				showDueOn,
				label,
				iconStyle,
				textStyle
			} = props,
			isMilestone = !isLabel(label),
		
		
			
			finalLabelStyle = (!isMilestone) ?
				this.makeLabelStyle(props as any,label as Label) :
				this.makeMilestoneStyle(props as any,label as Milestone),
			
			hovering = isHovering(this,'label','labelDot'),
			tooltipId = `label-tooltip-${label.id}`
		
		
		
		
		return mode === 'dot' ?
			// DOT CHIP
			
				<div ref="labelDot" data-for={tooltipId} data-tip style={finalLabelStyle}>
					{/*<Tooltip title={(label as Label).name}>*/}
					<Tooltip id={tooltipId} class="labelTooltip" key={tooltipId}>
						<LabelChip label={label} style={{padding: 0}} />
					</Tooltip>
				</div>
			 :
			
			// REGULAR CHIP
			<div
				ref='label'
				className="labelChip"
				style={[finalLabelStyle]}
				onClick={onClick}>
				
				 
				
				<LabelChipAccessory
					styles={styles}
					label={label}
					labelStyle={finalLabelStyle}
					iconStyle={iconStyle}
					isMilestone={isMilestone}
					onRemove={onRemove}
					showIcon={showIcon}
					hovering={hovering}
				/>
				
				<div style={[
						styles.text,
						(showIcon || onRemove) && styles.text.withLeftIcon,
						textStyle
					]}>
					
					{
						isLabel(label) ?
							label.name :
							`${label.title}${!showDueOn ? '' :
								this.formatDueOn(label)}`
					}
					
				</div>
			
			
			</div>
	}
	
}

/**
 * Render remove or icon accessory
 *
 * @param styles
 * @param label
 * @param labelStyle
 * @param iconStyle
 * @param isMilestone
 * @param onRemove
 * @param showIcon
 * @param hovering
 * @returns {any}
 * @constructor
 */
function LabelChipAccessory({ styles, label, labelStyle, iconStyle, isMilestone, onRemove, showIcon, hovering }) {
	return onRemove ?
		<div style={[
					styles.accessory,
					labelStyle.accessory,
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
						labelStyle.accessory,
						iconStyle
					]}>
				<Icon style={[styles.accessory.icon,iconStyle]}
				      iconSet='octicon'
				      iconName={isMilestone ? 'milestone' : 'tag'}/>
			</div> :
			React.DOM.noscript()
}

PureRender(BaseLabelChip)

export const LabelChip = ThemedStyles(baseStyles, 'labelChip')(BaseLabelChip)

export default LabelChip