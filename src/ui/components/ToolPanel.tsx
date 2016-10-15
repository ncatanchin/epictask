// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {ToolPanelLocation, IToolPanel, ITool} from "shared/tools/ToolTypes"
import { createToolPanelSelector, toolDraggingSelector } from "shared/actions/ui/UISelectors"
import {
	FlexRow, FlexColumnReverse, FlexColumn, FlexScale, makeFlexAlign, FillHeight, FillWidth,
	FlexAuto, OverflowHidden, makeFlex, FlexRowCenter,
	rem, Ellipsis
} from "shared/themes"
import {loadPlugins, addRegistryListener, RegistryEvent} from "shared/Registry"
import { ToolGutter } from "ui/components/ToolGutter"
import { ToolWrapper } from "ui/components/ToolWrapper"
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { colorAlpha } from "shared/themes/styles/ColorTools"



loadPlugins()

// Constants
const
	{Left,Right,Bottom,Popup} = ToolPanelLocation,
	log = getLogger(__filename)

// Styles

const
	// Gutter min dimension with content
	gutterHorizDim = rem(2),
	gutterVertDim = rem(2),
	
	// Vertical Gutter Style
	gutterVertical = [
		FlexColumn,
		FlexAuto,
		FillHeight,
		OverflowHidden,
		makeFlexAlign('flex-start','flex-start'),{
		minWidth: gutterHorizDim
	}],
	gutterHorizontal = [
		FlexRow,
		FlexAuto,
		FillWidth,
		OverflowHidden,{
			minHeight: gutterVertDim
		}
	]


function baseStyles(topStyles,theme,palette) {
	const
		{primary,accent,warn,success} = palette
	return {
		
		root: [ FlexScale, OverflowHidden, {
			border: 0,
			
			[Left]: [ FlexRow, FillHeight ],
			[Right]: [ FlexRow, FillHeight ],
			[Bottom]: [ FlexColumnReverse, FillWidth ],
			[Popup]: [ FlexColumn, FillWidth ]
			
		} ],
		
		tools: [ FlexScale, OverflowHidden, makeBorderRem(), {
			
			
			[Left]: [ FlexColumn, FillHeight, { borderLeftStyle: 'solid', borderLeftWidth: rem(0.1) } ],
			[Right]: [ FlexColumn, FillHeight, { borderRightStyle: 'solid', borderRightWidth: rem(0.1) } ],
			[Popup]: [ FlexRow, FillWidth, { borderTopStyle: 'solid', borderTopWidth: rem(0.1) } ],
			[Bottom]: [ FlexRow, FillWidth, { borderBottomStyle: 'solid', borderBottomWidth: rem(0.1) } ],
		} ],
		
		tool: [ FlexColumn, FlexScale, OverflowHidden, {
			[Left]: [ FillWidth ],
			[Right]: [ FillWidth ],
			[Bottom]: [ FillHeight ],
			[Popup]: [ FillHeight ],
			
			header: [ FlexRowCenter, makeFlex(0, 0, rem(2)), {
				// borderBottomStyle: 'solid',
				// borderBottomWidth: rem(0.1),
				
				label: [ FlexScale, Ellipsis, {
					fontSize: themeFontSize(1.2),
					padding: '0.4rem 0.5rem'
				} ]
			} ],
			
			container: [ OverflowHidden, PositionRelative, FlexScale, {
				borderStyle: 'solid',
				borderWidth: rem(0.1)
			} ]
		} ],
		
		gutter: [ makeTransition(['background-color','border','width','height','min-width','min-height']),{
			[Left]: [ ...gutterVertical ],
			[Right]: [ ...gutterVertical ],
			[Popup]: [ ...gutterHorizontal ],
			[Bottom]: [ ...gutterHorizontal ],
			
			dragging: [{
				border: `0.2rem solid ${colorAlpha(success.hue2,0.6)}`,
				backgroundColor: colorAlpha(success.hue3,0.8),
			}],
			
			dragHover: [{
				border: `0.2rem solid ${colorAlpha(success.hue1,0.6)}`,
				backgroundColor: colorAlpha(success.hue1,0.8),
			}]
			
			
		} ]
		
		
	}
}




/**
 * IToolPanelProps
 */
export interface IToolPanelProps extends IThemedAttributes {
	id?:string
	location:ToolPanelLocation
	panel?:IToolPanel
	dragging?:boolean
}


/**
 * ToolPanel
 *
 * @class ToolPanel
 * @constructor
 **/

@connect(() => createStructuredSelector({
	panel: createToolPanelSelector(),
	dragging: toolDraggingSelector
}))
@ThemedStyles(baseStyles,'toolPanel')
@PureRender
export class ToolPanelComponent extends React.Component<IToolPanelProps,any> {
	
	static displayName = 'ToolPanel'
	
	private unsubscribe = null
	
	componentWillMount() {
		this.unsubscribe = addRegistryListener((event,...args) => {
			log.info(`Registry event received: ${RegistryEvent[event]}`,args)
			this.forceUpdate()
		})
	}
	
	componentWillUnmount() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}
	}
	
	render() {
		const
			{styles,style,panel,dragging,location} = this.props,
			{tools,toolIds} = panel || {} as IToolPanel,
			toolList:ITool[] = toolIds.map(id => tools[id])
		
		return <div style={[styles.root,styles.root[location],style]}>
			{/* The Gutter of toggle controls and decorations */}
			
			<ToolGutter panel={panel}
			            dragging={dragging}
			            styles={styles.gutter}/>
			
			<div style={[styles.tools,styles.tools[location]]}>
				{toolList
					.filter(it => it.active)
					.map(tool => <ToolWrapper
						key={tool.id}
            styles={styles}
            panel={panel}
            tool={tool}/>
				)}
			</div>
		</div>
	}
	
}