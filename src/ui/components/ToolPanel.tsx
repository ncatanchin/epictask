// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Button, Icon,filterProps} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {ToolPanelLocation, IToolPanel, ITool, TToolMap} from "shared/tools/ToolTypes"
import {uiStateSelector} from "shared/actions/ui/UISelectors"
import {
	FlexRow, FlexColumnReverse, FlexColumn, FlexScale, makeFlexAlign, FillHeight, FillWidth,
	FlexAlignCenter, FlexAuto, makeTransition, FlexColumnCenter, OverflowHidden, makeFlex, makePaddingRem, FlexRowCenter,
	rem, Ellipsis
} from "shared/themes"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"
import {getToolComponent} from "shared/Registry"

// Constants
const
	{Left,Right,Bottom,Popup} = ToolPanelLocation,
	log = getLogger(__filename)

// Styles

const
	// Gutter min dimension with content
	gutterDim = rem(2),
	
	// Vertical Gutter Style
	gutterVertical = [
		FlexColumn,
		FlexAuto,
		FillHeight,
		OverflowHidden,
		makeFlexAlign('flex-start','flex-start'),{
		minWidth: gutterDim
	}],
	gutterHorizontal = [
		FlexRow,
		FlexAuto,
		FillWidth,
		OverflowHidden,{
			minHeight: gutterDim
		}
	],
	baseStyles = createStyles({
		root: [FlexAuto, {
		
			[Left]: [FlexRow,FillHeight],
			[Right]: [FlexRow,FillHeight],
			[Bottom]: [FlexColumn,FillWidth],
			[Popup]: [FlexColumn,FillWidth]
		
		}],
		
		tools: [FlexScale,{
			[Left]: [FlexColumn],
			[Right]: [FlexColumn],
			[Popup]: [FlexRow],
			[Bottom]: [FlexRow],
		}],
		
		tool: [FlexColumn,FlexScale,{
			[Left]: [FillWidth],
			[Right]: [FillWidth],
			[Bottom]: [FillHeight],
			[Popup]: [FillHeight],
			
			header: [FlexRowCenter,makeFlex(0,0,rem(2)),makePaddingRem(0.3,0.5),{
				label: [FlexScale,Ellipsis,{
					fontWeight: 500
				}]
			}]
		}],
		
		gutter: [{
			[Left]: [...gutterVertical],
			[Right]: [...gutterVertical],
			[Popup]: [...gutterHorizontal],
			[Bottom]: [...gutterHorizontal],
			
			/**
			 * Toggle button for opening/focusing tool
			 */
			toggle: [makeTransition(['opacity']),FlexColumnCenter,FlexAuto,{
				opacity: 1,
				pointerEvents: 'auto',
				textAlign: 'center',
				padding: 0,
				
				[Left]: [{width: gutterDim}],
				[Right]: [{width: gutterDim}],
				[Bottom]: [{height: gutterDim}],
				
				button: [FlexAlignCenter,makeFlex(0,1,'auto'),{
					padding: "0.5rem 0.3rem",
					[Left]: [FlexColumnReverse,{
						width: gutterDim
					}],
					[Right]: [FlexColumn,{
						width: gutterDim,
					}],
					[Bottom]: [FlexRow,{
						height: gutterDim
					}]
				}],
				
				// Label
				label: [makeFlex(0,1,'auto'),Ellipsis,{
					padding: "0.5rem 0.3rem",
					fontSize: rem(0.9),
					
					[Left]: [{
						textOrientation: "sideways-right",
						writingMode: "vertical-lr",
						transform: "rotate(0.5turn)"
					}],
					
					[Right]: [{
						textOrientation: "sideways-left",
						writingMode: "vertical-lr",
						transform: "rotate(-0.5turn)"
					}],
				}],
				
				// Icon
				icon: [makePaddingRem(0.4),{
					 fontSize: rem(1.1)
				}]
				
				
			}]
		}]
		
		
	})




/**
 * IToolPanelProps
 */
export interface IToolPanelProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
	id?:string
	location:ToolPanelLocation
	panel?:IToolPanel
}

/**
 * Tool toggle button
 *
 * @param props
 * @returns {any}
 * @constructor
 */
const ToggleButton = Radium((props) => {
	const
		{styles,tool,panel} = props,
		{location} = panel,
		toggleStyles = styles.gutter.toggle
	
	return <div style={[toggleStyles,toggleStyles[location]]}>
		<Button tabIndex={-1}
		        onClick={() => Container.get(UIActionFactory).toggleTool(tool.id)}
		        style={[toggleStyles.button,toggleStyles.button[location]]} >
			<Icon style={[toggleStyles.icon]} iconSet='octicon' iconName='repo'/>
			<div style={[toggleStyles.label,toggleStyles.label[location]]}>
				{tool.label}
			</div>
		</Button>
	</div>
	
})


const ToolWrapper = Radium((props:{styles:any,tool:ITool,panel:IToolPanel}) => {
	const
		{styles,tool,panel} = props,
		{location} = panel,
		toolStyles = styles.tool,
		ToolComponent = getToolComponent(tool.id)
	
	return <div style={[toolStyles,toolStyles[location]]}>
		<div style={[toolStyles.header,toolStyles.header[location]]}>
			<div style={[toolStyles.header.label]}>{tool.label}</div>
			
		</div>
		<ToolComponent style={[FlexScale]} tool={tool} visible={panel.open && tool.active} />
	</div>
})

/**
 * Gutter component
 *
 * @type {((props)=>any)|((component?:TElement)=>TElement)}
 */
const Gutter = Radium((props) => {
	const
		{panel,styles} = props,
		tools:TToolMap = _.get(panel,'tools',[]) as any
	
	return <div {...filterProps(props)} style={[styles.gutter,styles.gutter[panel.location]]}>
		{Object.values(tools).map(tool =>
			<ToggleButton key={tool.id} styles={styles} tool={tool} panel={panel}/>
		)}
	</div>
})

/**
 * ToolPanel
 *
 * @class ToolPanel
 * @constructor
 **/

@connect(() =>
	createDeepEqualSelector(
		[uiStateSelector,(state,props) => _.pick(props || {},'id','location')],
		(uiState,{id,location}) => {
			id = id || ToolPanelLocation[location]
			log.info(`Got id ${id} and location ${location} and tool panels = `,uiState.toolPanels)
			
			return {
				panel: uiState.toolPanels
					.get(id)
			}
		}
	)
)
@ThemedStyles(baseStyles,'toolPanel')
@PureRender
export class ToolPanelComponent extends React.Component<IToolPanelProps,any> {
	
	static displayName = 'ToolPanel'
	
	render() {
		const
			{styles,panel,location} = this.props,
			tools:ITool[] = Object.values(_.get(panel,'tools',{})) as any
		
		return <div style={[styles.root,styles.root[location]]}>
			{/* The Gutter of toggle controls and decorations */}
			
			<Gutter panel={panel}
			        styles={styles}/>
			
			<div style={[styles.tools,styles.tools[location]]}>
				{tools.filter(it => it.active).map(tool => {
					return <ToolWrapper styles={styles}
					                      panel={panel}
					                      tool={tool}/>
				})}
			</div>
		</div>
	}
	
}