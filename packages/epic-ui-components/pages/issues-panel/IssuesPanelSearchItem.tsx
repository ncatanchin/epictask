// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender, Chip } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import {
	Transparent, rem, FillHeight, FlexRowCenter, FlexAuto, Ellipsis, makePaddingRem,
	makeFlexAlign, FlexColumnCenter, FlexScale, makeBorder, FillWidth, PositionRelative, makeTransition
} from "epic-styles/styles"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ accent, primary, text, secondary } = palette,
		{itemHeight} = theme.search
	
	return [
		makeTransition([ 'background-color', 'color' ]),
		PositionRelative,
		FlexRowCenter,
		FillWidth, {
			height: itemHeight,
			cursor: 'pointer',
			borderBottom: makeBorder(rem(0.1),'solid',accent.hue1),
			color: primary.hue1,
			
			normal: {
				backgroundColor: text.primary,
				color: primary.hue1
			},
			
			selected: [{
				backgroundColor: accent.hue1,
				color: text.primary
			}],
			
			
			info: [
				FlexScale,
				FlexColumnCenter,
				makePaddingRem(0.2,2,0.2,1),
				makeFlexAlign('flex-start', 'center'), {
					
				}
			],
			
			label: [Ellipsis, FlexAuto, makePaddingRem(0, 1), {
				flexShrink: 1,
				fontWeight: 300,
				fontSize: rem(1.6),
				
				second: [FlexAuto, {
					fontWeight: 100,
					fontSize: rem(1.2)
				}],
				
				selected: [{
					fontWeight: 500
				}]
			}],
			
			action: [{
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				
				selected: [{
					
				}]
			}],
			
			type: [ FillHeight, FlexRowCenter, FlexAuto, Ellipsis, {
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				padding: rem(0.3),
				width: 48,
				background: Transparent,
				//borderRight: `0.1rem solid ${accent.hue1}`,
				
				selected: [{}]
			} ]
			
		} ]
}

declare global {
	interface IIssuePanelSearchItem {
		id:string
		type:string
		label:string
		value:any
	}
}
/**
 * IIssuesPanelSearchItemProps
 */
export interface IIssuesPanelSearchItemProps extends IThemedAttributes {
	item:IIssuePanelSearchItem
	selected?:boolean
}

/**
 * IIssuesPanelSearchItemState
 */
export interface IIssuesPanelSearchItemState {
	
}

/**
 * IssuesPanelSearchItem
 *
 * @class IssuesPanelSearchItem
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class IssuesPanelSearchItem extends React.Component<IIssuesPanelSearchItemProps,IIssuesPanelSearchItemState> {
	
	render() {
		const
			{
				styles,
				item,
				selected:isSelected
			} = this.props,
			// Make style
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected
			),
			
			labelStyle = makeStyle(
				styles.label,
				isSelected && styles.label.selected
			),
			
			typeStyle = makeStyle(
				styles.type,
				isSelected && styles.type.selected
			)
		
		return <div style={resultStyle}>
			{/*<div style={typeStyle}>*/}
				{/*<Icon iconSet='octicon' iconName={iconName}/>*/}
				{/*/!*{typeLabel}*!/*/}
			{/*</div>*/}
			<div style={styles.info}>
				<Chip item={item}/>
				{/*<div style={labelStyle}>*/}
					{/**/}
				{/*</div>*/}
			</div>
			{/*<div style={makeStyle(labelStyle,styles.label.second)}>*/}
				{/*{labelSecond}*/}
			{/*</div>*/}
		
		</div>
	}
	
}