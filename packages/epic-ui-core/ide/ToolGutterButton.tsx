
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { DragTypes } from "epic-global"
import { getUIActions } from "epic-typedux"
import { Icon,Button,PureRender } from "epic-ui-components"
import { DragSource, DragSourceConnector, DragSourceMonitor } from "react-dnd"
import { getEmptyImage } from "react-dnd-html5-backend"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles,theme,palette) {
	
	const
		// Gutter min dimension with content
		gutterHorizDim = rem(2),
		gutterVertDim = rem(2),
		{Left,Right,Bottom,Popup} = ToolPanelLocation
	
	return [ makeTransition([ 'opacity' ]), FlexAuto, makeMarginRem(0), makePaddingRem(0), {
		opacity: 1,
		pointerEvents: 'auto',
		textAlign: 'center',
		overflow: 'hidden',
		
		dragging: [{
			
		}],
		
		[Left]: [ {
			width: gutterHorizDim,
		} ],
		[Right]: [ {
			width: gutterHorizDim,
			
		} ],
		[Bottom]: [ {
			height: gutterVertDim,
			
		} ],
		[Popup]: [ { height: gutterVertDim } ],
		
		button: [ FlexAlignCenter, makeFlex(0, 1, 'auto'), makePaddingRem(0), {
			//position: 'static',
			
			dragging: [ {
				//position: 'static',
				
			} ],
			
			[Left]: [ FillWidth, FlexColumnReverse, {
				width: gutterHorizDim,
				maxWidth: gutterHorizDim,
				borderBottom: theme.tabBarSeparator,
				borderBottomWidth: 1,
				borderRadius: 0
			} ],
			[Right]: [ FillWidth, FlexColumn, makePaddingRem(0.5, 0), {
				width: gutterHorizDim,
				maxWidth: gutterHorizDim,
				//borderBottom: theme.tabBarSeparator,
			} ],
			[Popup]: [ FillHeight, FlexRow, makePaddingRem(0, 0.5), {
				height: gutterHorizDim
			} ],
			[Bottom]: [ FillHeight, FlexRow, makePaddingRem(0, 0.5), {
				height: gutterHorizDim
			} ]
		} ],
		
		// Label
		label: [ makeFlex(0, 1, 'auto'), Ellipsis, {
			
			fontSize: rem(1),
			fontWeight: 500,
			dragging: [FlexAuto,{
				
			}],
			
			[Left]: [ {
				padding: "0.5rem 0.3rem",
				textOrientation: "sideways-right",
				writingMode: "vertical-lr",
				transform: "rotate(0.5turn)"
			} ],
			
			[Right]: [ {
				padding: "0.5rem 0.3rem",
				textOrientation: "sideways-left",
				writingMode: "vertical-lr"
			} ],
			[Bottom]: [ { padding: "0rem 0.5rem", } ]
		} ],
		
		// Icon
		icon: [ makePaddingRem(0.4), {
			fontSize: rem(1.1)
		} ]
		
		
	} ]
	
}

export interface IToolGutterButtonProps extends IThemedAttributes {
	panel: IToolPanel
	tool: ITool
	buttonStyle?:any
	dndConnect?:Function
	dndPreview?:Function
	dndDragging?:boolean
}

/**
 * Tool toggle button, used to activate button from Gutter
 *
 * @param props
 * @returns {any}
 * @constructor
 */

@ThemedStyles(baseStyles)
@PureRender
export class ToolGutterButton extends React.Component<IToolGutterButtonProps,any> {
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	/**
	 * After the component mounts - setup the DnD preview
	 */
	componentDidMount() {
		if (this.props.dndPreview)
			this.props.dndPreview(getEmptyImage(), {
				captureDraggingState: true
			})
	}
	
	/**
	 * Render the gutter button
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{
				styles,
				tool,
				panel,
				style,
				dndDragging,
				buttonStyle,
				dndConnect
			} = this.props,
			{
				location
			} = panel,
			
			rootNode = <div style={makeStyle(
			styles,
			styles[location],
			dndDragging && styles.dragging,style)}>
				<Button tabIndex={-1}
				        onClick={() => getUIActions().toggleTool(tool.id)}
				        style={makeStyle(
			        	styles.button,
			        	styles.button[location],
			        	dndDragging && styles.button.dragging,
			        	buttonStyle)}
				>
					
					<Icon style={makeStyle(styles.icon)} iconSet='octicon' iconName='repo'/>
					<div style={makeStyle(
					styles.label,
					styles.label[location],
					dndDragging && styles.label.dragging)}>
						
						{tool.buttonLabel || tool.label}
					</div>
				
				</Button>
			</div>
		
		//log.debug(`Using style`,style,dndDragging)
		
		return dndConnect ? dndConnect(rootNode) : rootNode
	}
}


/**
 * Gutter button wrapped as a draggable source
 */
export const DraggableToolGutterButton = (DragSource as any)(DragTypes.GutterToolButton,{
	beginDrag(props,monitor,component) {
		const
			{tool,panel} = props
		
		log.debug(`Drag began`,props,component,tool)
		
		getUIActions().setToolDragging(true)
		
		return {
			id: tool.id,
			tool,
			panel
		}
	},
	endDrag(props,monitor,component) {
		log.debug(`Drag ended`,props,component)
		
		getUIActions().setToolDragging(false)
	}
},(connect, monitor) => ({
	dndPreview: connect.dragPreview(),
	dndConnect: connect.dragSource(),
	dndDragging: monitor.isDragging()
}))(ToolGutterButton)