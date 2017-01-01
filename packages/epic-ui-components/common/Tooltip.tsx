// Imports
import { Map, Record, List } from "immutable"
import * as React from 'react'
import { PureRender } from './PureRender'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexAuto, {} ]
}

export interface ITooltipNodeProps {
	tooltip?:string
	tooltipPos?:'top'|'bottom'|'right'|'left'
}

/**
 * ITooltipProps
 */
export interface ITooltipProps extends IThemedAttributes {
	text:string
	textStyle?:any
	pos?:'top'|'bottom'|'right'|'left'
}

/**
 * ITooltipState
 */
export interface ITooltipState {
	layer?
}

/**
 * Tooltip
 *
 * @class Tooltip
 * @constructor
 **/


@ThemedStyles(baseStyles)
@PureRender
export class Tooltip extends React.Component<ITooltipProps,ITooltipState> {
	
	static defaultProps = {
		pos: 'top'
	}
	
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	private getLayer() {
		const
			{theme,palette} = this.props,
			{primary,text,accent,background} = palette
		let
			{layer} = this.state
		
		if (!layer) {
			layer = $('<div>')
				.css(makeStyle({
					position: 'absolute',
					display: 'block',
					top: 0,
					left: 0,
					opacity: 0,
					zIndex: 9999,
					pointerEvents: 'none',
					borderRadius: rem(0.2),
					boxShadow: `inset 0rem 0rem 0.2rem 0.1rem ${primary.hue3}`,
					
					backgroundColor: primary.hue1,//theme.inactiveColor,
					color: text.primary
				},Styles.makeTransition(['opacity']),Styles.Ellipsis,Styles.makePaddingRem(0.3,0.8)))
			
			this.setState({layer})
		}
		
		return layer
	}
	
	private showLayer = () => {
		const
			{pos} = this.props,
			rect = this.getParent()[0].getBoundingClientRect(),
			layer = this.getLayer().text(this.props.text).appendTo($('body')),
			layerRect = layer[0].getBoundingClientRect()
		
		let
			[top,left,translate] = pos === 'top' ?
				[rect.top - layerRect.height,rect.left + (rect.width / 2),'-50%,0'] :
				pos === 'bottom' ?
					[rect.top + rect.height,rect.left + (rect.width / 2),'-50%,0'] :
					pos === 'left' ?
						[rect.top + (rect.height / 2),rect.left - layerRect.width,'0,-50%'] :
						[rect.top + (rect.height / 2),rect.left + layerRect.width,'0,-50%']
			layer.css({opacity: 1,top,left,transform:`translate(${translate})`})
		$(document).on('click',this.hideLayer)
		
	}
	
	private hideLayer = () => {
		$(document).off('click',this.hideLayer)
		this.getLayer().css({opacity: 0}).remove()
	}
	
	private getParent = () => {
		const
			{root} = this.refs
		
		return root  && $(root).parent()
	}
	
	refs:any
	
	componentDidMount():void {
		
		this.getParent().on({
			mouseenter: this.showLayer,
			mouseleave: this.hideLayer
		})
	
	}
	
	
	componentWillUnmount():void {
		if (this.state.layer) {
			this.state.layer.remove()
			this.setState({layer: null})
		}
		
	}
	
	render() {
		const { styles } = this.props
		
		return <div ref="root" />
	}
	
}


// @ThemedStyles(baseStyles)
// @PureRender
// export class TooltipLayer extends React.Component<ITooltipProps,ITooltipState> {
//
// 	render() {
// 		const
// 			{styles} = this.props
//
// 		return <div style={styles.layer}>
// 			<div style={styles.layer.tooltips}>
// 				{tooltips}
// 			</div>
// 			{this.props.children}
// 		</div>
// 	}
// }