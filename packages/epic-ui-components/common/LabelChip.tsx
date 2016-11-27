/**
 * Created by jglanz on 8/9/16.
 */
// Imports

import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { Label, Milestone } from "epic-models"
import { getValue } from "epic-global"
import { isLabel } from "epic-models/Label"
import { makeIcon } from "epic-styles/styles"
import { Chip } from "./Chip"

const
	tinycolor = require('tinycolor2'),
	Tooltip = require('react-tooltip')
	

// Constants
//noinspection JSUnusedLocalSymbols
const
	log = getLogger(__filename)

/**
 * ILabelChipProps
 */
export interface ILabelChipProps {
	theme?:any
	styles?:any
	onClick?:React.MouseEventHandler<any>
	mode?:TChipMode
	label:Label|Milestone
	labelStyle?:any
	textStyle?:any
	iconStyle?:any
	showIcon?:boolean
	showDueOn?:boolean
	showRemove?:boolean
	onRemove?:TChipCallback
}

/**
 * LabelChip
 *
 * @class LabelChip
 * @constructor
 **/

@PureRender
export class LabelChip extends React.Component<ILabelChipProps,any> {
	
	static defaultProps = {
		mode: 'normal'
	}
	
	formatDueOn(milestone:Milestone) {
		const
			due = getValue(() => milestone.due_on)
		
		return !due ? '' : `  (due on ${moment(due).format('MM-DD-YY')})`
	}
	
	render() {
		const
			{props} = this,
			{
				showIcon,
				onClick,
				onRemove,
				mode,
				showDueOn,
				label,
				labelStyle,
				iconStyle,
				textStyle
			} = props,
			isMilestone = !isLabel(label),
			
			chipProps = {
				icon: showIcon && makeIcon('octicon',isMilestone ? 'milestone' : 'tag'),
				item: label,
				mode,
				onRemove,
				onClick,
				iconStyle,
				textStyle,
				style: labelStyle
			}
		
		return <Chip
			{...chipProps}
		/>
		// mode === 'dot' ?
		// 	// DOT CHIP
		//
		// 		<div ref="labelDot" data-for={tooltipId} data-tip style={finalLabelStyle}>
		// 			{/*<Tooltip title={(label as Label).name}>*/}
		// 			<Tooltip id={tooltipId} class="labelTooltip" key={tooltipId}>
		// 				<LabelChip label={label} style={{padding: 0}} />
		// 			</Tooltip>
		// 		</div>
		// 	 :
		//
		// 	// REGULAR CHIP
		// 	<div
		// 		ref='label'
		// 		className="labelChip"
		// 		style={[finalLabelStyle]}
		// 		onClick={onClick}>
		//
		//
		//
		// 		<LabelChipAccessory
		// 			styles={styles}
		// 			label={label}
		// 			labelStyle={finalLabelStyle}
		// 			iconStyle={iconStyle}
		// 			isMilestone={isMilestone}
		// 			onRemove={onRemove}
		// 			showIcon={showIcon}
		// 			hovering={hovering}
		// 		/>
		//
		// 		<div style={[
		// 				styles.text,
		// 				(showIcon || onRemove) && styles.text.withLeftIcon,
		// 				textStyle
		// 			]}>
		//
		// 			{
		// 				isLabel(label) ?
		// 					label.name :
		// 					`${label.title}${!showDueOn ? '' :
		// 						this.formatDueOn(label)}`
		// 			}
		//
		// 		</div>
		//
		//
		// 	</div>
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

