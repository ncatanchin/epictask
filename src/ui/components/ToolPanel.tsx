// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Button, Icon,filterProps} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {ToolPanelLocation, IToolPanel, ITool, TToolMap} from "shared/tools/ToolTypes"
import {uiStateSelector} from "shared/actions/ui/UISelectors"
import {
	FlexRow, FlexColumnReverse, FlexColumn, FlexScale, makeFlexAlign, FillHeight, FillWidth,
	FlexAlignCenter, FlexAuto, makeTransition, FlexColumnCenter, OverflowHidden, makeFlex, makePaddingRem, FlexRowCenter,
	rem, Ellipsis
} from "shared/themes"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"
import {getToolComponent, getToolHeaderControls, loadPlugins, addRegistryListener, RegistryEvent} from "shared/Registry"
import { getUIActions } from "shared/actions/ActionFactoryProvider"

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
	],
	baseStyles = createStyles({
		root: [FlexScale, OverflowHidden, {
			border: 0,
			
			[Left]: [FlexRow,FillHeight],
			[Right]: [FlexRow,FillHeight],
			[Bottom]: [FlexColumnReverse,FillWidth],
			[Popup]: [FlexColumn,FillWidth]
		
		}],
		
		tools: [FlexScale,OverflowHidden,makeBorderRem(),{
			
		
			[Left]: [FlexColumn,FillHeight, {borderLeftStyle: 'solid',borderLeftWidth: rem(0.1)}],
			[Right]: [FlexColumn,FillHeight, {borderRightStyle: 'solid',borderRightWidth: rem(0.1)}],
			[Popup]: [FlexRow,FillWidth, {borderTopStyle: 'solid',borderTopWidth: rem(0.1)}],
			[Bottom]: [FlexRow,FillWidth, {borderBottomStyle: 'solid',borderBottomWidth: rem(0.1)}],
		}],
		
		tool: [FlexColumn,FlexScale,OverflowHidden,{
			[Left]: [FillWidth],
			[Right]: [FillWidth],
			[Bottom]: [FillHeight],
			[Popup]: [FillHeight],
			
			header: [FlexRowCenter,makeFlex(0,0,rem(2)),{
				// borderBottomStyle: 'solid',
				// borderBottomWidth: rem(0.1),
				
				label: [FlexScale,Ellipsis,{
					fontSize: themeFontSize(1.2),
					padding: '0.4rem 0.5rem'
				}]
			}],
			
			container: [OverflowHidden,PositionRelative,FlexScale,{
				borderStyle: 'solid',
				borderWidth: rem(0.1)
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
			toggle: [makeTransition(['opacity']),PositionRelative,FlexColumnCenter,FlexAuto,{
				opacity: 1,
				pointerEvents: 'auto',
				textAlign: 'center',
				padding: 0,
				margin: 0,
				
				[Left]: [{width: gutterHorizDim}],
				[Right]: [{width: gutterHorizDim}],
				[Bottom]: [{height: gutterVertDim}],
				[Popup]: [{height: gutterVertDim}],
				
				button: [FlexAlignCenter,makeFlex(0,1,'auto'),{
					padding: 0,//"0.5rem 0.3rem",
					
					[Left]: [FillWidth,FlexColumnReverse,{
						width: gutterHorizDim
					}],
					[Right]: [FillWidth,FlexColumn,{
						width: gutterHorizDim,
						padding: "0.5rem 0 0.5rem 0"
					}],
					[Popup]: [FillHeight,FlexRow,{
						height: gutterHorizDim,
						padding: "0rem 0.5rem 0 0.5rem"
					}],
					[Bottom]: [FillHeight,FlexRow,{
						height: gutterHorizDim,
						padding: "0rem 0.5rem 0 0.5rem"
					}]
				}],
				
				// Label
				label: [makeFlex(0,1,'auto'),Ellipsis,{
					
					fontSize: rem(0.9),
					
					[Left]: [{
						padding: "0.5rem 0.3rem",
						textOrientation: "sideways-right",
						writingMode: "vertical-lr",
						transform: "rotate(0.5turn)"
					}],
					
					[Right]: [{
						padding: "0.5rem 0.3rem",
						textOrientation: "sideways-left",
						writingMode: "vertical-lr",
						transform: "rotate(-0.5turn)"
					}],
					[Bottom]: [{padding: "0rem 0.5rem",}]
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
export interface IToolPanelProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	id?:string
	location:ToolPanelLocation
	panel?:IToolPanel
}

/**
 * Tool toggle button, used to activate button from Gutter
 *
 * @param props
 * @returns {any}
 * @constructor
 */
const GutterButton = Radium((props) => {
	const
		{styles,tool,panel} = props,
		{location} = panel,
		toggleStyles = styles.gutter.toggle
	
	return <div style={[toggleStyles,toggleStyles[location]]}>
		<Button tabIndex={-1}
		        onClick={() => getUIActions().toggleTool(tool.id)}
		        style={[toggleStyles.button,toggleStyles.button[location]]} >
			<Icon style={[toggleStyles.icon]} iconSet='octicon' iconName='repo'/>
			<div style={[toggleStyles.label,toggleStyles.label[location]]}>
				{/* Default to 'buttonLabel' / if null then use 'label' */}
				{tool.buttonLabel || tool.label}
			</div>
		</Button>
	</div>
	
})

interface IToolWrapperProps {
	styles:any
	tool:ITool
	panel:IToolPanel
}

@Radium
class ToolWrapper extends React.Component<IToolWrapperProps,any> {
	
	render() {
		const
			{styles,tool,panel} = this.props,
			{location} = panel,
			toolStyles = styles.tool,
			ToolComponent = getToolComponent(tool.id),
			ToolHeaderControls = getToolHeaderControls(tool.id)
		
		return <div style={[toolStyles,toolStyles[location]]} className="toolWrapper">
			<div style={[toolStyles.header,toolStyles.header[location]]}>
				<div style={[toolStyles.header.label]}>{tool.label}</div>
				{ToolHeaderControls}
			</div>
			<div style={[toolStyles.container]}>
				<ToolComponent tool={tool} panel={panel} visible={panel.open && tool.active} />
			</div>
		</div>
	}
}


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
			<GutterButton key={tool.id} styles={styles} tool={tool} panel={panel}/>
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
			{styles,style,panel,location} = this.props,
			tools:ITool[] = Object.values(_.get(panel,'tools',{})) as any
		
		return <div style={[styles.root,styles.root[location],style]}>
			{/* The Gutter of toggle controls and decorations */}
			
			<Gutter panel={panel}
			        styles={styles}/>
			
			<div style={[styles.tools,styles.tools[location]]}>
				{tools.filter(it => it.active).map(tool => {
					return <ToolWrapper key={tool.id}
					                    styles={styles}
					                    panel={panel}
					                    tool={tool}/>
				})}
			</div>
		</div>
	}
	
}