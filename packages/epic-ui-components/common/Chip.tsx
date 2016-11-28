/**
 * Created by jglanz on 8/9/16.
 */
// Imports

import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import {
	makePaddingRem, FlexColumnCenter, FlexRowCenter, FlexAuto, isHovering,
	makeTransition, rem, PositionRelative, CSSHoverState
} from "epic-styles/styles"

const
	tiny = require('tinycolor2'),
	Tooltip = require('react-tooltip')


// Constants
//noinspection JSUnusedLocalSymbols
const
	log = getLogger(__filename)


/**
 * Base styles
 *
 * @param topStyles
 * @param theme
 * @param palette
 */
export function baseStyles(topStyles, theme, palette) {
	
	const
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
	
	return [ makeTransition('width'), PositionRelative, FlexAuto, FlexRowCenter, {
			display: 'flex',
			borderRadius: accessoryDimHalf,
			height: accessoryDim,
			//borderRadius: '0.3rem',
			marginTop: 0,
			marginRight: rem(1),
			marginBottom: 0,
			marginLeft: 0,
			boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)',
			
			[CSSHoverState]: [{
				
			}],
			
			collapsed: [ {
				width: rem(2.4)
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
		
	}]
}





/**
 * IChipProps
 */
export interface IChipProps extends IThemedAttributes {
	
	onClick?:React.MouseEventHandler<any>
	mode?:TChipMode
	color?:string
	item:IChipItem
	icon?:IIcon
	textStyle?:any
	iconStyle?:any
	onRemove?:TChipCallback
}

/**
 * Chip
 *
 * @class Chip
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param

class BaseChip extends React.Component<IChipProps,any> {
	
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
	
	
	colorStyle(item:IChipItem) {
		const
			{
				theme,
				color:propColor
			} = this.props,
			
			// BG COLOR props -> item -> black
			backgroundColor = '#' + (propColor || item.color || '000000'),
			
			color = tiny.mostReadable(backgroundColor, [
				theme.textColor,
				tiny(theme.alternateTextColor).lighten(20)
			]).toRgbString()
		
		return {
			cursor: 'pointer',
			backgroundColor,
			color,
			accessory: {
				backgroundColor: tiny(backgroundColor).darken(10).toRgbString()
			}
		}
		
	}
	
	
	
	
	render() {
		const
			{props} = this,
			{
				styles,
				onClick,
				onRemove,
				mode,
				item,
				style,
				icon,
				iconStyle,
				textStyle
			} = props,
			
			
			text = item.label || item.name || item.title,
			
			itemStyle = makeStyle(
				styles,
				this.colorStyle(item),
				...(Array.isArray(style) ? style : [style])
			),
			
			hovering = isHovering(this,'label','labelDot'),
			tooltipId = `chip-tooltip-${item.id}`
		
		
		
		
		return mode === 'dot' ?
			// DOT CHIP
			
			<div ref="labelDot"
			     style={itemStyle}
			     data-for={tooltipId}
			     data-tip>
				
				{/*<Tooltip title={(label as Label).name}>*/}
				<Tooltip id={tooltipId} class="labelTooltip" key={tooltipId}>
					<Chip item={item} style={{padding: 0}} />
				</Tooltip>
			</div>
			:
			
			// REGULAR CHIP
			<div
				ref='label'
				className="labelChip"
				style={[itemStyle]}
				onClick={onClick}>
				
				
				
				<ChipAccessory
					styles={styles}
					item={item}
					itemStyle={itemStyle}
					iconStyle={iconStyle}
					icon={icon}
					onRemove={onRemove}
					hovering={hovering}
				/>
				
				<div style={[
						styles.text,
						(icon || onRemove) && styles.text.withLeftIcon,
						textStyle
					]}>
					
					{text}
				
				</div>
			
			
			</div>
	}
	
}

/**
 * Render remove or icon accessory
 *
 * @param styles
 * @param iconStyle
 * @param onRemove
 * @param hovering
 * @param item
 * @param itemStyle
 * @param icon
 * @returns {DOMElement<HTMLAttributes<HTMLElement>, HTMLElement>}
 * @constructor
 */
function ChipAccessory({ styles, item, itemStyle, iconStyle, onRemove, icon, hovering }) {
	return onRemove ?
		<div style={[
					styles.accessory,
					itemStyle.accessory,
					hovering && styles.accessory.hover,
					hovering && styles.accessory.remove.hover
					]} className="removeControl">
			<Icon
				style={makeStyle(
								styles.accessory.icon,
								styles.accessory.remove.icon,
								hovering && styles.accessory.remove.hover.icon
								
							)}
				onClick={(event) => (onRemove(item), event.stopPropagation(),event.preventDefault())}>
				clear
			</Icon>
		</div> :
		
		// ICON
		icon ?
			<div style={[
						styles.accessory,
						itemStyle.accessory,
						iconStyle
					]}>
				<Icon
					{...icon}
					style={[styles.accessory.icon,iconStyle]}
				/>
			</div> :
			React.DOM.noscript()
}

/**
 * Add PureRender Decoration
 */
PureRender(BaseChip)

/**
 * Theme the cip
 *
 * @type {any}
 */
export const Chip = ThemedStyles(baseStyles, 'chip')(BaseChip)

