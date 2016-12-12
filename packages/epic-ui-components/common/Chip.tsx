/**
 * Created by jglanz on 8/9/16.
 */
// Imports

import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import {chipStyles} from './Chip.styles'
import {isHovering} from "epic-styles/styles"

const
	tiny = require('tinycolor2'),
	Tooltip = require('react-tooltip')


// Constants
//noinspection JSUnusedLocalSymbols
const
	log = getLogger(__filename)






/**
 * IChipProps
 */
export interface IChipProps extends IThemedAttributes {
	
	onClick?:React.MouseEventHandler<any>
	mode?:TChipMode
	color?:string
	item:IChipItem
	icon?:IIcon
	accessoryStyle?:any
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
				color:propColor,
				palette
			} = this.props,
			
			{text} = palette,
			
			
			
			// BG COLOR props -> item -> black
			backgroundColor = '#' + (propColor || item.color || '000000'),
			
			color = tiny.mostReadable(backgroundColor, [
				text.primary,
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
				textStyle,
				accessoryStyle
			} = props,
			
			
			text = item.label || item.name || item.title,
			
			itemStyle = mergeStyles(
				styles,
				this.colorStyle(item),
				style
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
					accessoryStyle={accessoryStyle}
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
const ChipAccessory = Radium(({ styles,accessoryStyle, item, itemStyle, iconStyle, onRemove, icon, hovering }) => {
	
	return onRemove ?
		<div style={[
					styles.accessory,
					itemStyle.accessory,
					hovering && styles.accessory.hover,
					hovering && styles.accessory.remove.hover,
					accessoryStyle
					]} className="removeControl">
			<Icon
				style={mergeStyles(
					styles.accessory.icon,
					styles.accessory.remove.icon,
					hovering && styles.accessory.remove.hover.icon,
					accessoryStyle && accessoryStyle.icon
				)}
				onClick={(event) => (onRemove(item,event), event.stopPropagation(),event.preventDefault())}>
				clear
			</Icon>
		</div> :
		
		// ICON
		icon ?
			<div style={[
				styles.accessory,
				itemStyle.accessory,
				iconStyle,
				accessoryStyle
			]}>
				<Icon
					{...icon}
					style={mergeStyles(styles.accessory.icon,iconStyle,accessoryStyle && accessoryStyle.icon)}
				/>
			</div> :
			React.DOM.noscript()
})

/**
 * Add PureRender Decoration
 */
PureRender(BaseChip)

/**
 * Theme the cip
 *
 * @type {any}
 */
export const Chip = ThemedStyles(chipStyles, 'chip')(BaseChip)

