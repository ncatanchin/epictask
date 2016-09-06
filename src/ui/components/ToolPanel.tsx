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
import {FlexRow, FlexColumnReverse} from "shared/themes"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"

// Constants
const log = getLogger(__filename)

// Styles

const
	gutterDim = rem(2),
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
		root: [FlexColumn, FlexAuto, {
		
			[ToolPanelLocation.Left]: [FlexRow,FillHeight],
			[ToolPanelLocation.Right]: [FlexRow,makeFlexAlign('center','flex-start'),FillHeight],
			[ToolPanelLocation.Bottom]: [FlexColumn,makeFlexAlign('center','flex-start'),FillWidth],
			[ToolPanelLocation.Window]: [FlexColumn,makeFlexAlign('center','flex-start'),FillWidth]
		
		}],
		
		tools: [FlexScale,{
			[ToolPanelLocation.Left]: [FlexColumn],
			[ToolPanelLocation.Right]: [FlexColumn],
			[ToolPanelLocation.Window]: [FlexRow],
			[ToolPanelLocation.Bottom]: [FlexColumn],
		}],
		
		gutter: [{
			[ToolPanelLocation.Left]: [...gutterVertical],
			[ToolPanelLocation.Right]: [...gutterVertical],
			[ToolPanelLocation.Window]: [...gutterHorizontal],
			[ToolPanelLocation.Bottom]: [...gutterHorizontal],
			
			/**
			 * Toggle button for opening/focusing tool
			 */
			toggle: [makeTransition(['opacity']),FlexColumnCenter,FlexAuto,{
				opacity: 1,
				pointerEvents: 'auto',
				textAlign: 'center',
				padding: 0,
				
				[ToolPanelLocation.Left]: [{width: gutterDim}],
				[ToolPanelLocation.Right]: [{width: gutterDim}],
				[ToolPanelLocation.Bottom]: [{height: gutterDim}],
				button: [FlexAlignCenter,FlexAuto,{
					padding: "0.5rem 0.3rem",
					[ToolPanelLocation.Left]: [FlexColumnReverse,{
						width: gutterDim
					}],
					[ToolPanelLocation.Right]: [FlexColumn,{
						width: gutterDim,
					}],
					[ToolPanelLocation.Bottom]: [FlexRow,{
						height: gutterDim
					}]
				}],
				
				// Label
				label: [{
					padding: "0.5rem 0.3rem",
					fontSize: rem(0.9),
					
					[ToolPanelLocation.Left]: [{
						textOrientation: "sideways-right",
						writingMode: "vertical-lr",
						transform: "rotate(0.5turn)"
					}],
					
					[ToolPanelLocation.Right]: [{
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
@Radium
@PureRender
export class ToolPanelComponent extends React.Component<IToolPanelProps,any> {
	
	static displayName = 'ToolPanel'
	
	render() {
		const
			{theme, styles,panel,location} = this.props,
			tools:ITool[] = Object.values(_.get(panel,'tools',{})) as any
		
		return <div style={[styles.root,styles.root[location]]}>
			<Gutter panel={panel}
			        styles={styles}/>
			{tools.filter(it => it.active).map(tool => {
				return <div style={[styles.tools,styles.tools[location]]}>{tool.id} / {tool.label}</div>
			})}
		</div>
	}
	
}