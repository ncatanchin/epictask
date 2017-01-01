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
	style?:any
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
				textStyle,
				styles,
				style
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
				style: makeStyle(style,labelStyle),
				styles
			}
		
		return <Chip
			{...chipProps}
		/>
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

